import { ImageResponse } from 'next/og';
import { SITE_URL } from '@/lib/site';

export const runtime = 'edge';
export const alt = 'Factpick - 근거로 비교하는 건강 정보';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #f8fbff 0%, #e8f3ff 58%, #d7ecff 100%)',
          padding: '72px 82px',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', width: 680 }}>
          <div
            style={{
              display: 'flex',
              width: 'fit-content',
              border: '1px solid #b9dcff',
              borderRadius: 16,
              background: 'rgba(255,255,255,0.82)',
              color: '#0b63ce',
              padding: '12px 20px',
              fontSize: 28,
              fontWeight: 700,
            }}
          >
            Pharmacist-reviewed evidence
          </div>
          <div style={{ display: 'flex', marginTop: 42, fontSize: 96, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
            Factpick
          </div>
          <div style={{ display: 'flex', marginTop: 26, fontSize: 45, fontWeight: 700, color: '#1e3a5f', lineHeight: 1.18 }}>
            Evidence-based health guide
          </div>
          <div style={{ display: 'flex', marginTop: 36, gap: 18, color: '#34536f', fontSize: 28, fontWeight: 700 }}>
            <span>Effect size</span>
            <span style={{ color: '#93a9bd' }}>·</span>
            <span>Evidence level</span>
            <span style={{ color: '#93a9bd' }}>·</span>
            <span>Safety</span>
          </div>
          <div style={{ display: 'flex', marginTop: 54, fontSize: 30, fontWeight: 700, color: '#0b63ce' }}>
            factpick.co.kr
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 330,
            height: 330,
            borderRadius: 56,
            background: 'rgba(255,255,255,0.78)',
            boxShadow: '0 24px 70px rgba(8, 78, 158, 0.20)',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${SITE_URL}/favicon.png`} width="260" height="260" alt="" />
        </div>
      </div>
    ),
    size,
  );
}
