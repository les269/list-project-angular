export interface FileRequest {
  path: string;
  moveTo?: string;
}

export interface FileExistRequest {
  path: string;
  name: string;
}
