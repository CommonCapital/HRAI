import Processing from "../../../../../public/processing"

export const ProcessingState = () => {
   return (
    <div className="bg-white min-h-[1000px] rounded-lg px-4 py-5 flex flex-col gap-y-8 items-center justify-center">
         <Processing />

         <div className="text-center justify-center">
        <h2 className="text-2xl font-bold text-gray-800">            Completed</h2>
        <p className="text-gray-500 mt-2">
          Your task has been successfully completed, but the data report would appear soon.
        </p>
      </div>
    </div>
   )
}