// Simple localStorage utilities for anchor persistence
export interface AnchorData {
  id: string;
  text: string;
  position: { x: number; y: number; z: number };
  orientation: { x: number; y: number; z: number; w: number };
  timestamp: number;
  persistentHandle?: string;
}

// Simple localStorage functions
export const saveAnchor = (anchor: AnchorData): void => {
  try {
    const anchors = getAllAnchors();
    anchors.push(anchor);
    localStorage.setItem('spatial-anchors', JSON.stringify(anchors));
  } catch (error) {
    console.error('Failed to save anchor:', error);
  }
};

export const getAllAnchors = (): AnchorData[] => {
  try {
    const stored = localStorage.getItem('spatial-anchors');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load anchors:', error);
    return [];
  }
};

export const deleteAnchor = (id: string): void => {
  try {
    const anchors = getAllAnchors().filter(anchor => anchor.id !== id);
    localStorage.setItem('spatial-anchors', JSON.stringify(anchors));
  } catch (error) {
    console.error('Failed to delete anchor:', error);
  }
};

export const clearAllAnchors = (): void => {
  try {
    localStorage.removeItem('spatial-anchors');
  } catch (error) {
    console.error('Failed to clear anchors:', error);
  }
}