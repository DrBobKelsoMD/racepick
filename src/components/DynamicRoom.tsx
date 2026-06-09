'use client';

import dynamic from 'next/dynamic';

const RoomClient = dynamic(() => import('@/components/RoomClient'), { ssr: false });

export default function DynamicRoom({ code }: { code: string }) {
  return <RoomClient code={code} />;
}
