export interface EvolutionAPIPort {
  fetchInstances(): Promise<any[]>;
  connectionState(instanceName: string): Promise<any>;
  connect(instanceName: string): Promise<any>;
  getBase64FromMediaMessage(instanceName: string, messageId: string): Promise<any>;
}
