import Cancelled from "../../../../../public/cancelled"


export const CancelledState = () => {
   return (
    <div className="bg-white rounded-lg px-4 py-5 flex flex-col gap-y-8 items-center justify-between">
         <Cancelled />
            <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800">Meeting Cancelled</h2>
        <p className="text-gray-500 mt-2">
          Meeting has been cancelled.
        </p>
      </div>
    </div>
   )
}