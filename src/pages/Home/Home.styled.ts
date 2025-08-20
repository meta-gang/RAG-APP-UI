import styled from "styled-components";
import { EColor } from "@styles/color";
import { Title1 } from "@styles/font";

export const Container = styled.div`
	display: flex;
	flex-direction: column;
	gap: 12px;
	height: 90vh;
	padding: 24px;
`;

export const Title = styled.div`
	color: ${EColor.TEXT_700};
	${Title1};
`;