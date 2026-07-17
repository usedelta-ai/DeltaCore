export interface EvolutionAPIPort {
  fetchInstances(): Promise<any[]>;
  connectionState(instanceName: string): Promise<any>;
  connect(instanceName: string): Promise<any>;
  getBase64FromMediaMessage(instanceName: string, messageId: string): Promise<any>;
  sendTextMessage(instanceName: string, number: string, text: string, quoted?: string): Promise<any>;
  sendMediaMessage(instanceName: string, number: string, mediaType: string, mediaBase64: string, options?: { caption?: string; fileName?: string; delay?: number }): Promise<any>;
  sendWhatsAppAudio(instanceName: string, number: string, audioBase64: string, options?: { delay?: number }): Promise<any>;
  sendPresence(instanceName: string, number: string, presence: 'composing' | 'recording'): Promise<any>;
  fetchProfilePictureUrl(instanceName: string, number: string): Promise<any>;
}
