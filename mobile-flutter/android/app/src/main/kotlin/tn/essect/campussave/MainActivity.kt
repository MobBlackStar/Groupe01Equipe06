package tn.essect.campussave

import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build
import android.os.Bundle
import io.flutter.embedding.android.FlutterActivity

class MainActivity : FlutterActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        createHighImportanceChannel()
    }

    // Android 8+ : sans canal « haute importance », les notifications arrivent sans bannière ni son.
    // Le même identifiant est envoyé par le serveur (android.notification.channelId).
    private fun createHighImportanceChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val channel = NotificationChannel(
            "campussave_high_importance",
            "Notifications CampusSave",
            NotificationManager.IMPORTANCE_HIGH
        ).apply {
            description = "Commandes, tickets, retraits et nouvelles offres"
            enableVibration(true)
            setShowBadge(true)
        }
        getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
    }
}
