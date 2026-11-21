# Keep ML Kit Barcode scanning classes and dependencies
-keep class com.google.mlkit.** { *; }
-keep interface com.google.mlkit.** { *; }
-keep class com.google.android.gms.vision.** { *; }

# Keep CameraX classes and dependencies
-keep class androidx.camera.** { *; }
-keep interface androidx.camera.** { *; }

# Keep mobile_scanner plugin classes
-keep class dev.steenbakker.mobile_scanner.** { *; }
-keep interface dev.steenbakker.mobile_scanner.** { *; }

# Suppress harmless warnings during release R8 shrink
-dontwarn com.google.mlkit.**
-dontwarn androidx.camera.**
-dontwarn dev.steenbakker.mobile_scanner.**
