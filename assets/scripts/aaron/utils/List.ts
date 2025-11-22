/**
 * 遍历
 * @param arr 列表
 * @param visit 列表项处理方法
 * @param reverse 倒叙遍历
 */
export function each<ItemType>(
  arr: ItemType[],
  visit: (v: ItemType, i?: number, l?: ItemType[]) => void,
  reverse: boolean = false
): void {
  const len = arr.length;
  if (len == 0) return;
  if (reverse) {
    for (let i = len - 1; i >= 0; i--) visit(arr[i], i, arr);
  } else {
    for (let i = 0; i < len; i++) visit(arr[i], i, arr);
  }
}

/**
 * 遍历，符合条件时打断
 * @param arr 列表
 * @param visit 列表项处理方法
 * @param reverse 倒序遍历
 */
function until<ItemType>(
  arr: ItemType[],
  visit: (v: ItemType, i?: number, l?: ItemType[]) => boolean,
  reverse: boolean = false
): void {
  const len = arr.length;
  if (len == 0) return;
  if (reverse) {
    for (let i = len - 1; i >= 0; i--) if (visit(arr[i], i, arr) === true) break;
  } else {
    for (let i = 0; i < len; i++) if (visit(arr[i], i, arr) === true) break;
  }
}
