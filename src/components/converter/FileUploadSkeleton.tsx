import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";

export function FileUploadSkeleton() {
  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
      <div className="text-center space-y-4">
        <LoadingSkeleton
          variant="image"
          className="w-16 h-16 mx-auto rounded-lg"
        />
        <div className="space-y-2">
          <LoadingSkeleton variant="text" lines={1} className="w-48 mx-auto" />
          <LoadingSkeleton variant="text" lines={1} className="w-64 mx-auto" />
        </div>
        <LoadingSkeleton variant="button" className="w-32 h-10 mx-auto" />
        <LoadingSkeleton variant="text" lines={1} className="w-40 mx-auto" />
      </div>
    </div>
  );
}
