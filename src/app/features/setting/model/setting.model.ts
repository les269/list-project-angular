export interface Setting {
  name: string;
  value: string;
  description: string;
  enabled: boolean;
  updatedTime: string;
}

export interface DatabaseConfig {
  configId: string;
  configName: string;
  databaseType: string;
  jdbcUrl: string;
  driverClassName: string;
  host: string;
  port: number;
  databaseName: string;
  username: string;
  password: string;
  hibernateDialect: string;
  additionalProperties: string;
  enabled: number;
  description: string;
  createdTime: string;
  updatedTime: string;
  sqliteFilePath: string;
}

export interface TestConnectionResult {
  success: boolean;
  message: string;
}
