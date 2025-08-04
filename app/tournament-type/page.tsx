"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Clock, Hourglass } from "lucide-react"
import { MobileFrame } from "@/components/mobile-frame"

export default function TournamentTypePage() {
  return (
    <MobileFrame>
      <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-gray-900 to-black text-white p-4">
        <h1 className="text-3xl font-extrabold mb-8 text-green-400 drop-shadow-lg">Choose Tournament Type</h1>
        <div className="flex flex-col gap-5 w-full max-w-xs">
          <Link href="/competition" passHref>
            <Button className="w-full bg-gradient-to-r from-button-green to-green-600 hover:from-green-600 hover:to-button-green text-white py-4 text-xl font-bold rounded-xl shadow-lg transition-all duration-300 flex items-center justify-center gap-3">
              <Hourglass className="w-6 h-6" />
              Long Tournament
            </Button>
          </Link>
          <Link href="/competition" passHref>
            <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-800 hover:to-blue-600 text-white py-4 text-xl font-bold rounded-xl shadow-lg transition-all duration-300 flex items-center justify-center gap-3">
              <Clock className="w-6 h-6" />
              Short Tournament
            </Button>
          </Link>
        </div>
        <div className="mt-10">
          <Link href="/" passHref>
            <Button
              variant="ghost"
              className="text-gray-400 hover:bg-gray-700 hover:text-white rounded-lg py-3 transition-all duration-200"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Squad
            </Button>
          </Link>
        </div>
      </div>
    </MobileFrame>
  )
}
