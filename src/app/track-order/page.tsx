'use client';

import { redirect, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

function Redirector() {
  const searchParams = useSearchParams();
  
  // Construct the search query string to pass it on to the destination page.
  // This is useful if the original link had something like `?orderId=...`
  const searchQuery = searchParams.toString();
  const destination = `/my-account/orders${searchQuery ? `?search=${searchParams.get('orderId')}` : ''}`;
  
  // The redirect needs to be called outside of the component's render phase.
  // Using a client component with redirect is the standard way to handle this.
  redirect(destination);

  // This part will not be rendered due to the redirect.
  return null;
}

function LoadingFallback() {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-16 w-16 text-primary animate-spin" />
      </div>
    );
}

export default function TrackOrderPage() {
    // useSearchParams() must be used within a Suspense boundary.
    return (
        <Suspense fallback={<LoadingFallback />}>
            <Redirector />
        </Suspense>
    );
}
