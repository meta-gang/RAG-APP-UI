/**
 * assets/svgs에서 지정한 이름의 SVG 컴포넌트를 렌더합니다.
 * @param name 아이콘 키
 * @param width 가로 크기
 * @param height 세로 크기
 * @param fill fill 색상
 * @param stroke stroke 색상 (선택)
 */
import * as Icons from '@assets/svgs';

interface SvgIconProps {
  name: keyof typeof Icons;
  width: string | number | undefined;
  height: string | number | undefined;
  fill: string;
  stroke?: string;
}

export default function SvgIcon({ name, width, height, fill, stroke }: SvgIconProps) {
  const Svg = Icons[name];
  return <Svg width={width} height={height} fill={fill} stroke={stroke ?? undefined} />;
}
