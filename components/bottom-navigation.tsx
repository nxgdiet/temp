import { Button } from "@/components/ui/button"
import { Home, Trophy, Shirt, User, BarChart3 } from "lucide-react"

export function BottomNavigation() {
  return (
    <div className="flex justify-around p-3 bg-bottom-nav-bg border-t border-gray-800 shadow-lg">
      <Button variant="ghost" className="text-white hover:bg-gray-700 p-2 rounded-lg transition-all duration-200">
        <Home className="w-6 h-6 text-gray-300 hover:text-green-400" />
      </Button>
      <Button variant="ghost" className="text-white hover:bg-gray-700 p-2 rounded-lg transition-all duration-200">
        <BarChart3 className="w-6 h-6 text-gray-300 hover:text-green-400" />
      </Button>
      <Button variant="ghost" className="text-white hover:bg-gray-700 p-2 rounded-lg transition-all duration-200">
        <Shirt className="w-6 h-6 text-gray-300 hover:text-green-400" />
      </Button>
      <Button variant="ghost" className="text-white hover:bg-gray-700 p-2 rounded-lg transition-all duration-200">
        <Trophy className="w-6 h-6 text-gray-300 hover:text-green-400" />
      </Button>
      <Button variant="ghost" className="text-white hover:bg-gray-700 p-2 rounded-lg transition-all duration-200">
        <User className="w-6 h-6 text-gray-300 hover:text-green-400" />
      </Button>
    </div>
  )
}
