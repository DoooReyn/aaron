import { Table } from '../../aaron';

/** Dialogue 配置表条目映射形式 */
export interface ITblDialogue {
  id: number;
  text: string;
}
/** Dialogue 配置表条目列表形式 */
export type RTblDialogue = [id: number, text: string];
/** Dialogue 配置表注册信息 */
export const TableDialogue: Table<RTblDialogue, ITblDialogue> = {
  token: 'TableDialogue',
  header: ['id', 'text'],
};
/** Role 配置表条目映射形式 */
export interface ITblRole {
  id: number;
  damage: number;
  name: string;
  gender: 0 | 1 | 2;
  dialogue: Array<number>;
  direction5: boolean;
  model: [number, number, string];
  action: Record<string, number>;
  sound: { idle: number; move: number; atk: number };
  param: { name: string; trigger: number };
  obj: { name: string; scores: Array<number>; config: { x: number; y: number } };
}
/** Role 配置表条目列表形式 */
export type RTblRole = [
  id: number,
  damage: number,
  name: string,
  gender: 0 | 1 | 2,
  dialogue: Array<number>,
  direction5: boolean,
  model: [number, number, string],
  action: Record<string, number>,
  sound: { idle: number; move: number; atk: number },
  param: { name: string; trigger: number },
  obj: { name: string; scores: Array<number>; config: { x: number; y: number } }
];
/** Role 配置表注册信息 */
export const TableRole: Table<RTblRole, ITblRole> = {
  token: 'TableRole',
  header: ['id', 'damage', 'name', 'gender', 'dialogue', 'direction5', 'model', 'action', 'sound', 'param', 'obj'],
};
