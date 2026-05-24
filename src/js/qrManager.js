/**
 * QR Manager - Генерация QR-кодов для участков
 */
export class QRManager {
    constructor() {
        this.modal = null;
        this.qrContainer = null;
        this.infoElement = null;
    }

    init(modalId, qrContainerId, infoId) {
        this.modal = document.getElementById(modalId);
        this.qrContainer = document.getElementById(qrContainerId);
        this.infoElement = document.getElementById(infoId);
    }

    async generateQR(data, parcelInfo) {
        if (!this.qrContainer) return;

        // Очищаем предыдущий QR
        this.qrContainer.innerHTML = '';

        try {
            // Генерируем QR код с данными участка
            const qrData = typeof data === 'string' ? data : JSON.stringify(data);
            
            const canvas = await QRCode.toCanvas(qrData, {
                width: 200,
                margin: 2,
                color: {
                    dark: '#0d1a12',
                    light: '#ffffff'
                }
            });

            this.qrContainer.appendChild(canvas);

            // Обновляем информацию
            if (this.infoElement && parcelInfo) {
                this.infoElement.textContent = parcelInfo;
            }

            return true;
        } catch (error) {
            console.error('QR generation error:', error);
            this.qrContainer.innerHTML = '<p style="color: #e63a46;">Ошибка генерации QR</p>';
            return false;
        }
    }

    show(parcelData) {
        if (!this.modal) return;

        const parcelInfo = `Участок ${parcelData.number || 'N/A'}\n${parcelData.variety || ''}\n${parcelData.area ? parcelData.area + ' га' : ''}`;
        
        this.generateQR(parcelData, parcelInfo).then(() => {
            this.modal.classList.add('active');
        });
    }

    hide() {
        if (!this.modal) return;
        this.modal.classList.remove('active');
    }

    isVisible() {
        return this.modal && this.modal.classList.contains('active');
    }
}
