import { NodeInfo } from '../types/house-model';
import { SceneNodeHierarchyMeta } from '../types/scene-interaction';

/**
 * Builds comprehensive hierarchy metadata for all nodes in the GLB scene graph
 */
export function buildSceneHierarchyIndex(
  allNodesFlat: NodeInfo[]
): Map<string, SceneNodeHierarchyMeta> {
  const nodeMapByIndex = new Map<number, NodeInfo>();
  const nodeMapByName = new Map<string, NodeInfo>();

  allNodesFlat.forEach((n) => {
    nodeMapByIndex.set(n.index, n);
    nodeMapByName.set(n.name, n);
  });

  const metaMap = new Map<string, SceneNodeHierarchyMeta>();

  allNodesFlat.forEach((node) => {
    // 1. Trace upward ancestors
    const path: string[] = [node.name];
    let parentRoom: NodeInfo | null = null;
    let parentFloor: NodeInfo | null = null;

    let currentParentIdx = node.parentIndex;
    while (currentParentIdx !== null && nodeMapByIndex.has(currentParentIdx)) {
      const parentNode = nodeMapByIndex.get(currentParentIdx)!;
      path.unshift(parentNode.name);

      // Check for Room ancestor if not found yet
      if (!parentRoom && (parentNode.classification === 'ROOM' || /^ROOM[_-]/i.test(parentNode.name))) {
        parentRoom = parentNode;
      }

      // Check for Floor ancestor if not found yet
      if (!parentFloor && (parentNode.classification === 'FLOOR' || /^FLOOR[_-]/i.test(parentNode.name))) {
        parentFloor = parentNode;
      }

      currentParentIdx = parentNode.parentIndex;
    }

    // If the node itself is a room, set parentRoom to self or keep as self-reference
    const isRoom = node.classification === 'ROOM' || /^ROOM[_-]/i.test(node.name);
    const isFloor = node.classification === 'FLOOR' || /^FLOOR[_-]/i.test(node.name);
    const isObject = node.classification === 'OBJ' || /^OBJ[_-]/i.test(node.name);
    const isAnchor = node.isAnchor || node.classification === 'ANCHOR' || /^ANCHOR[_-]/i.test(node.name);

    metaMap.set(node.name, {
      node,
      parentRoom: isRoom ? node : parentRoom,
      parentFloor: isFloor ? node : parentFloor,
      hierarchyPath: path,
      descendantMeshNames: [],
      isAnchor,
      isRoom,
      isFloor,
      isObject,
    });
  });

  // 2. Collect descendant mesh names for each node (for recursive room/floor highlight & visibility)
  allNodesFlat.forEach((node) => {
    const descendantMeshes: string[] = [];

    const collectMeshes = (n: NodeInfo) => {
      if (n.hasMesh) {
        descendantMeshes.push(n.name);
      }
      if (n.childrenIndices && n.childrenIndices.length > 0) {
        n.childrenIndices.forEach((cIdx) => {
          const childNode = nodeMapByIndex.get(cIdx);
          if (childNode) collectMeshes(childNode);
        });
      }
    };

    collectMeshes(node);

    const meta = metaMap.get(node.name);
    if (meta) {
      meta.descendantMeshNames = descendantMeshes;
    }
  });

  return metaMap;
}

/**
 * Extracts list of unique Floor names from model nodes
 */
export function extractFloorNames(allNodesFlat: NodeInfo[]): string[] {
  return allNodesFlat
    .filter((n) => n.classification === 'FLOOR' || /^FLOOR[_-]/i.test(n.name))
    .map((n) => n.name);
}

/**
 * Extracts list of unique Room names from model nodes
 */
export function extractRoomNames(allNodesFlat: NodeInfo[]): string[] {
  return allNodesFlat
    .filter((n) => n.classification === 'ROOM' || /^ROOM[_-]|ROOM/i.test(n.name))
    .map((n) => n.name);
}

