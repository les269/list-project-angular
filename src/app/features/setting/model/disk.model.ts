export interface Disk {
  disk: string;
  totalSpace: number;
  freeSpace: number;
  usableSpace: number;
  updateDate: string;
  usedSpace?: number;
}

export interface DiskAddRequest {
  disk: string;
}
