import { builtinResMgr, Material, Node, UIRenderer } from 'cc';

/**
 * 设置节点材质（包括子节点）
 * @param node - 目标节点
 * @param material - 材质，传入 null 表示取消材质
 * @param properties - 材质属性的可选映射表
 */
function setEffect(node: Node, material: Material | null, properties?: Record<string, any>): void {
  if (node == null || node.isValid == false) return;
  const renders = node.getComponentsInChildren(UIRenderer);
  const diveToProperties = material && properties;
  for (let i = 0, l = renders.length; i < l; i++) {
    if (diveToProperties) {
      for (let p in properties) {
        material.setProperty(p, properties[p]);
      }
    }
    renders[i].customMaterial = material;
  }
}

/**
 * 将节点恢复正常（取消材质效果）
 * @param node - 目标节点
 */
function resetEffect(node: Node): void {
  setEffect(node, null);
}

/**
 * 将节点置灰
 * 使用内置的灰色材质将节点及其子节点设置为灰度显示
 * @param node - 目标节点
 */
function setGrayEffect(node: Node): void {
  setEffect(node, builtinResMgr.get<Material>('ui-sprite-gray-material'));
}

export { setEffect, resetEffect, setGrayEffect };
