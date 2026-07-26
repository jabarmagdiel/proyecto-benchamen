import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';

import 'services/auth_service.dart';
import 'screens/login_screen.dart';
import 'screens/home_layout.dart';

void main() {
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthService()..loadUser()),
      ],
      child: const MyApp(),
    ),
  );
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Swinterno',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        scaffoldBackgroundColor: const Color(0xFF05080F), // Aún más oscuro para mejor contraste neón
        primaryColor: const Color(0xFF20CDFE),
        textTheme: GoogleFonts.outfitTextTheme(Theme.of(context).textTheme),
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF20CDFE),
          brightness: Brightness.dark,
          surface: const Color(0xFF15233D),
        ),
        useMaterial3: true,
      ),
      home: Consumer<AuthService>(
        builder: (context, authService, _) {
          if (authService.token == null && authService.role == null) {
            // Might be still loading from SharedPreferences or truly logged out.
            // Since we call loadUser() in main, we assume it's quick enough or we can handle a splash screen.
            // For now, if no token, go to login.
            return const LoginScreen();
          }

          if (authService.isAuthenticated) {
            if (authService.role == 'administrador' || authService.role == 'operativo') {
              return const HomeLayout();
            } else {
              // Fallback for other roles (e.g. client)
              return const Scaffold(
                body: Center(
                  child: Text('Rol no soportado en esta versión', style: TextStyle(color: Colors.white)),
                ),
              );
            }
          }

          return const LoginScreen();
        },
      ),
    );
  }
}
