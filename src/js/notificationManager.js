/**
 * Notification Manager - Система уведомлений
 */
export class NotificationManager {
    constructor(notificationId, textId) {
        this.notification = document.getElementById(notificationId);
        this.textElement = document.getElementById(textId);
        this.timeout = null;
    }

    show(message, type = 'info', duration = 3000) {
        if (!this.notification || !this.textElement) return;

        // Сбрасываем предыдущее уведомление
        this.hide();

        // Устанавливаем текст и тип
        this.textElement.textContent = message;
        this.notification.className = 'notification';
        this.notification.classList.add(type);

        // Показываем
        setTimeout(() => {
            this.notification.classList.add('show');
        }, 10);

        // Автоматическое скрытие
        if (duration > 0) {
            this.timeout = setTimeout(() => {
                this.hide();
            }, duration);
        }
    }

    hide() {
        if (!this.notification) return;

        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }

        this.notification.classList.remove('show');
    }

    success(message, duration = 3000) {
        this.show(message, 'success', duration);
    }

    error(message, duration = 5000) {
        this.show(message, 'error', duration);
    }

    warning(message, duration = 4000) {
        this.show(message, 'warning', duration);
    }

    info(message, duration = 3000) {
        this.show(message, 'info', duration);
    }
}
