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
