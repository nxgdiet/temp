// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TournamentEscrow is ReentrancyGuard, Ownable {
    
    constructor() Ownable(msg.sender) {}
    
    struct TournamentResult {
        uint256 tournamentId;
        address participant1;
        address participant2;
        address token1;
        address token2;
        address winner;
        uint256 amount1;
        uint256 amount2;
        bool isCompleted;
        uint256 timestamp;
    }
    
    struct Escrow {
        address participant;
        address token;
        uint256 amount;
        bool isDeposited;
        bool isWithdrawn;
    }
    
    // Mappings
    mapping(uint256 => TournamentResult) public tournaments;
    mapping(uint256 => mapping(address => Escrow)) public escrows; // tournamentId => participant => Escrow
    mapping(uint256 => bool) public tournamentExists;
    
    // Events
    event TournamentCreated(uint256 indexed tournamentId, address participant1, address participant2);
    event EscrowDeposited(uint256 indexed tournamentId, address indexed participant, address token, uint256 amount);
    event TournamentCompleted(uint256 indexed tournamentId, address indexed winner, uint256 totalPayout);
    event EmergencyWithdraw(uint256 indexed tournamentId, address indexed participant, uint256 amount);
    
    // Modifiers
    modifier tournamentExistsModifier(uint256 _tournamentId) {
        require(tournamentExists[_tournamentId], "Tournament does not exist");
        _;
    }
    
    modifier onlyParticipant(uint256 _tournamentId) {
        require(
            msg.sender == tournaments[_tournamentId].participant1 || 
            msg.sender == tournaments[_tournamentId].participant2,
            "Not a tournament participant"
        );
        _;
    }
    
    modifier tournamentNotCompleted(uint256 _tournamentId) {
        require(!tournaments[_tournamentId].isCompleted, "Tournament already completed");
        _;
    }
    
    /**
     * @dev Creates a new tournament with two participants
     * @param _tournamentId Unique identifier for the tournament
     * @param _participant1 Address of the first participant
     * @param _participant2 Address of the second participant
     */
    function createTournament(
        uint256 _tournamentId,
        address _participant1,
        address _participant2
    ) external onlyOwner {
        require(!tournamentExists[_tournamentId], "Tournament already exists");
        require(_participant1 != _participant2, "Participants must be different");
        require(_participant1 != address(0) && _participant2 != address(0), "Invalid participant address");
        
        tournaments[_tournamentId] = TournamentResult({
            tournamentId: _tournamentId,
            participant1: _participant1,
            participant2: _participant2,
            token1: address(0),
            token2: address(0),
            winner: address(0),
            amount1: 0,
            amount2: 0,
            isCompleted: false,
            timestamp: block.timestamp
        });
        
        tournamentExists[_tournamentId] = true;
        
        emit TournamentCreated(_tournamentId, _participant1, _participant2);
    }
    
    /**
     * @dev Allows participants to deposit tokens into escrow
     * @param _tournamentId The tournament ID
     * @param _token Address of the ERC20 token (use address(0) for ETH)
     * @param _amount Amount of tokens to deposit (ignored for ETH, use msg.value)
     */
    function depositEscrow(
        uint256 _tournamentId,
        address _token,
        uint256 _amount
    ) external payable tournamentExistsModifier(_tournamentId) onlyParticipant(_tournamentId) tournamentNotCompleted(_tournamentId) nonReentrant {
        
        require(!escrows[_tournamentId][msg.sender].isDeposited, "Already deposited for this tournament");
        
        uint256 actualAmount;
        
        if (_token == address(0)) {
            // ETH deposit
            require(msg.value > 0, "Must send ETH");
            actualAmount = msg.value;
        } else {
            // ERC20 token deposit
            require(_amount > 0, "Amount must be greater than 0");
            require(msg.value == 0, "Don't send ETH for token deposits");
            
            IERC20 token = IERC20(_token);
            require(token.transferFrom(msg.sender, address(this), _amount), "Token transfer failed");
            actualAmount = _amount;
        }
        
        // Update escrow
        escrows[_tournamentId][msg.sender] = Escrow({
            participant: msg.sender,
            token: _token,
            amount: actualAmount,
            isDeposited: true,
            isWithdrawn: false
        });
        
        // Update tournament data
        if (msg.sender == tournaments[_tournamentId].participant1) {
            tournaments[_tournamentId].token1 = _token;
            tournaments[_tournamentId].amount1 = actualAmount;
        } else {
            tournaments[_tournamentId].token2 = _token;
            tournaments[_tournamentId].amount2 = actualAmount;
        }
        
        emit EscrowDeposited(_tournamentId, msg.sender, _token, actualAmount);
    }
    
    /**
     * @dev Announces the winner and distributes all escrowed funds
     * @param _tournamentId The tournament ID
     * @param _winner Address of the winning participant
     */
    function announceWinner(
        uint256 _tournamentId,
        address _winner
    ) external onlyOwner tournamentExistsModifier(_tournamentId) tournamentNotCompleted(_tournamentId) nonReentrant {
        
        TournamentResult storage tournament = tournaments[_tournamentId];
        
        require(
            _winner == tournament.participant1 || _winner == tournament.participant2,
            "Winner must be one of the participants"
        );
        
        require(
            escrows[_tournamentId][tournament.participant1].isDeposited &&
            escrows[_tournamentId][tournament.participant2].isDeposited,
            "Both participants must have deposited funds"
        );
        
        tournament.winner = _winner;
        tournament.isCompleted = true;
        
        // Calculate total payout
        uint256 totalETH = 0;
        uint256 totalTokens = 0;
        address tokenAddress = address(0);
        
        // Check participant 1's escrow
        Escrow storage escrow1 = escrows[_tournamentId][tournament.participant1];
        if (escrow1.token == address(0)) {
            totalETH += escrow1.amount;
        } else {
            totalTokens += escrow1.amount;
            tokenAddress = escrow1.token;
        }
        
        // Check participant 2's escrow
        Escrow storage escrow2 = escrows[_tournamentId][tournament.participant2];
        if (escrow2.token == address(0)) {
            totalETH += escrow2.amount;
        } else {
            if (tokenAddress == address(0)) {
                tokenAddress = escrow2.token;
                totalTokens += escrow2.amount;
            } else if (tokenAddress == escrow2.token) {
                totalTokens += escrow2.amount;
            } else {
                // Different tokens - transfer each separately
                IERC20(escrow2.token).transfer(_winner, escrow2.amount);
            }
        }
        
        // Transfer ETH to winner
        if (totalETH > 0) {
            (bool success, ) = _winner.call{value: totalETH}("");
            require(success, "ETH transfer failed");
        }
        
        // Transfer tokens to winner
        if (totalTokens > 0 && tokenAddress != address(0)) {
            IERC20(tokenAddress).transfer(_winner, totalTokens);
        }
        
        // Mark escrows as withdrawn
        escrow1.isWithdrawn = true;
        escrow2.isWithdrawn = true;
        
        emit TournamentCompleted(_tournamentId, _winner, totalETH + totalTokens);
    }
    
    /**
     * @dev Emergency withdraw function in case tournament is cancelled
     * @param _tournamentId The tournament ID
     */
    function emergencyWithdraw(uint256 _tournamentId) 
        external 
        tournamentExistsModifier(_tournamentId) 
        onlyParticipant(_tournamentId) 
        tournamentNotCompleted(_tournamentId) 
        nonReentrant 
    {
        Escrow storage escrow = escrows[_tournamentId][msg.sender];
        require(escrow.isDeposited, "No deposit found");
        require(!escrow.isWithdrawn, "Already withdrawn");
        
        uint256 amount = escrow.amount;
        address token = escrow.token;
        
        escrow.isWithdrawn = true;
        
        if (token == address(0)) {
            // Withdraw ETH
            (bool success, ) = msg.sender.call{value: amount}("");
            require(success, "ETH withdrawal failed");
        } else {
            // Withdraw tokens
            IERC20(token).transfer(msg.sender, amount);
        }
        
        emit EmergencyWithdraw(_tournamentId, msg.sender, amount);
    }
    
    /**
     * @dev Get tournament details
     * @param _tournamentId The tournament ID
     */
    function getTournament(uint256 _tournamentId) 
        external 
        view 
        tournamentExistsModifier(_tournamentId) 
        returns (TournamentResult memory) 
    {
        return tournaments[_tournamentId];
    }
    
    /**
     * @dev Get escrow details for a participant
     * @param _tournamentId The tournament ID
     * @param _participant The participant address
     */
    function getEscrow(uint256 _tournamentId, address _participant) 
        external 
        view 
        tournamentExistsModifier(_tournamentId) 
        returns (Escrow memory) 
    {
        return escrows[_tournamentId][_participant];
    }
    
    /**
     * @dev Check if both participants have deposited
     * @param _tournamentId The tournament ID
     */
    function bothParticipantsDeposited(uint256 _tournamentId) 
        external 
        view 
        tournamentExistsModifier(_tournamentId) 
        returns (bool) 
    {
        return escrows[_tournamentId][tournaments[_tournamentId].participant1].isDeposited &&
               escrows[_tournamentId][tournaments[_tournamentId].participant2].isDeposited;
    }
    
    // Function to receive ETH
    receive() external payable {}
}