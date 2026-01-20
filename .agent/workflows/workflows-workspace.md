---
description: Golbal-wrkflows
---

# WORKSPACE WORKFLOW (Always On) - One-shot Product Detail Page Builder

## 트리거
사용자 메시지에 아래 중 하나가 포함되면 "상세페이지 생성 모드"로 실행한다:
- "상세페이지", "제품 상세", "상품페이지", "랜딩페이지", "상세 HTML", "상세 만들기"

## ONE-SHOT 입력 스키마(LLM이 자동 정규화)
사용자 메시지에서 아래 JSON을 먼저 만든다. 부족하면 기본값으로 채운다.

{
  "brand": "",
  "product_name": "",
  "category": "일반상품|식품|건강기능식품|화장품|생활용품|기타",
  "price": "",
  "options": [{"name":"", "price_delta":0}],
  "target": "누가 쓰는지",
  "key_benefits": ["핵심 장점 3~7개(사실 기반)"],
  "ingredients_or_specs": ["성분/스펙(사용자 제공 기반)"],
  "how_to_use": ["사용법/섭취법"],
  "warnings": ["주의사항"],
  "shipping_return": {
    "shipping": "",
    "return_policy": "",
    "cs": ""
  },
  "tone": "신뢰형|감성형|프리미엄형|가성비형",
  "style": "깔끔|고급|미니멀|블랙|화이트",
  "assets": {
    "hero_image": "",
    "detail_images": []
  }
}

기본값(입력 부족 시 자동 채움):
- brand 없으면: "브랜드명"
- price 없으면: "가격 별도 문의" (가격 추정 금지)
- options 없으면: 단일 옵션
- shipping_return 비어있으면: "스토어 정책에 따름" + "문의: 카카오/전화"
- assets 없으면: 이미지 생성 프롬프트를 제공

## 자동 생성 결과(필수)
아래 3가지를 반드시 생성한다:

1) HTML (복붙형, 단일 파일)
- 모바일 우선 반응형
- 섹션: Hero / 핵심혜택 / 상세설명 / 성분·스펙 / 사용법 / FAQ / 리뷰(예시) / 배송·교환환불 / 주의사항 / CTA

2) 카피 세트
- 메인 헤드라인 5개
- 서브카피 5개
- 구매 유도 CTA 10개
- 후기 요청 문구 5개

3) 운영용 JSON
- 상품요약, 섹션별 텍스트, FAQ, SEO, JSON-LD 포함

## 건강/식품 카테고리 추가 안전 규칙
category가 "식품" 또는 "건강기능식품"이면:
- 치료/예방/의학적 표현 제거
- “개인차가 있습니다” 문구 포함
- 사용자가 인증/기능성 문구를 제공하지 않으면 임의 생성 금지

## 최종 출력 포맷(고정)
- "✅ 상세페이지 HTML"
- "✅ 카피/문구 세트"
- "✅ 운영용 JSON(SEO + JSON-LD 포함)"
순서로 출력한다.
