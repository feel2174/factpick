import { ImageResponse } from 'next/og';

export const alt = '팩트픽 — 약사가 검증한 약·영양제 효과 비교';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// 이미지에 들어가는 모든 글자 (구글폰트 서브셋용)
const GLYPHS =
  '팩트픽약사검수메타분석근거과영양제진짜효를로비교능SMDvsfactpickcokrCochrane·,';

async function loadFont(weight: number): Promise<ArrayBuffer> {
  const url = `https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@${weight}&text=${encodeURIComponent(
    GLYPHS,
  )}`;
  const css = await (await fetch(url)).text();
  const match = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/);
  if (!match) throw new Error('Noto Sans KR 서브셋 URL을 찾지 못함');
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
        {/* 좌측 강조 바 */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 16,
            background: '#059669',
          }}
        />

        {/* 상단 배지 */}
        <div style={{ display: 'flex' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: '#ecfdf5',
              color: '#047857',
              border: '1px solid #6ee7b7',
              borderRadius: 999,
              padding: '12px 24px',
              fontSize: 30,
              fontWeight: 700,
            }}
          >
            약사 검수 · Cochrane 메타분석 근거
          </div>
        </div>

        {/* 본문 */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              fontSize: 150,
              fontWeight: 700,
              color: '#0f172a',
              letterSpacing: -4,
              lineHeight: 1,
            }}
          >
            팩트픽
          </div>
          <div
            style={{
              display: 'flex',
              marginTop: 28,
              fontSize: 46,
              fontWeight: 500,
              color: '#334155',
            }}
          >
            약과 영양제, 진짜 효과를 근거로 비교
          </div>

          {/* 산점도 범례 힌트 */}
          <div style={{ display: 'flex', marginTop: 36, gap: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{ width: 26, height: 26, borderRadius: 999, background: '#22c55e' }}
              />
              <div style={{ display: 'flex', fontSize: 32, color: '#475569' }}>영양제</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{ width: 26, height: 26, borderRadius: 999, background: '#ef4444' }}
              />
              <div style={{ display: 'flex', fontSize: 32, color: '#475569' }}>약</div>
            </div>
          </div>
        </div>

        {/* 하단 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div
            style={{ display: 'flex', fontSize: 34, fontWeight: 700, color: '#059669' }}
          >
            factpick.co.kr
          </div>
          <div style={{ display: 'flex', fontSize: 30, color: '#94a3b8' }}>
            효능 vs 근거 · SMD 비교
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
