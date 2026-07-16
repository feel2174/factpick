import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = '팩트픽 - 근거로 비교하는 약·영양제';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const GLYPHS =
  '팩트픽약영양제효과근거비교임상연구약사검수건강고민SMDfactpickcokr';

async function loadFont(weight: number): Promise<ArrayBuffer> {
  const url = `https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@${weight}&text=${encodeURIComponent(
    GLYPHS,
  )}`;
  const css = await (await fetch(url)).text();
  const match = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/);
  if (!match) throw new Error('Noto Sans KR subset URL not found');
  return (await fetch(match[1])).arrayBuffer();
}

export default async function OgImage() {
  const [bold, regular] = await Promise.all([loadFont(700), loadFont(500)]);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#ffffff',
          padding: '72px 80px',
          fontFamily: 'Noto',
        }}
      >
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 16, background: '#047857' }} />

        <div style={{ display: 'flex' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: '#ecfdf5',
              color: '#047857',
              border: '1px solid #6ee7b7',
              borderRadius: 12,
              padding: '12px 24px',
              fontSize: 30,
              fontWeight: 700,
            }}
          >
            약사 검수 · 임상 근거 기반
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: 142, fontWeight: 700, color: '#0f172a', lineHeight: 1 }}>
            팩트픽
          </div>
          <div style={{ display: 'flex', marginTop: 28, fontSize: 46, fontWeight: 500, color: '#334155' }}>
            약과 영양제의 실제 효과를 근거로 비교
          </div>

          <div style={{ display: 'flex', marginTop: 36, gap: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 26, height: 26, borderRadius: 999, background: '#22c55e' }} />
              <div style={{ display: 'flex', fontSize: 32, color: '#475569' }}>효과 크기</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 26, height: 26, borderRadius: 999, background: '#0f172a' }} />
              <div style={{ display: 'flex', fontSize: 32, color: '#475569' }}>근거 수준</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', fontSize: 34, fontWeight: 700, color: '#047857' }}>
            factpick.co.kr
          </div>
          <div style={{ display: 'flex', fontSize: 30, color: '#94a3b8' }}>
            건강 고민별 비교표
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Noto', data: bold, weight: 700, style: 'normal' },
        { name: 'Noto', data: regular, weight: 500, style: 'normal' },
      ],
    },
  );
}
