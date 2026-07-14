export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://factpick.co.kr'
).replace(/\/$/, '');

export const SITE_NAME = '팩트픽';

export const SITE_TITLE = '팩트픽 — 약사가 검증한 약·영양제 효과 비교';

export const SITE_DESCRIPTION =
  '약사가 Cochrane 메타분석으로 검증한 약·영양제 효과 비교. 광고·후기가 아닌 SMD(효과 크기) 데이터로 내게 진짜 효과 있는 옵션을 1분 안에 찾으세요.';
