import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/auth_service.dart';
import 'operative_screen.dart';
import 'admin_screen.dart';
import 'profile_screen.dart';
import 'notifications_screen.dart';

class HomeLayout extends StatefulWidget {
  const HomeLayout({super.key});

  @override
  State<HomeLayout> createState() => _HomeLayoutState();
}

class _HomeLayoutState extends State<HomeLayout> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    final authService = Provider.of<AuthService>(context);
    final isOperative = authService.role == 'operativo';

    // Páginas dependiendo del rol
    final List<Widget> pages = [
      isOperative ? const OperativeScreen() : const AdminScreen(),
      const NotificationsScreen(),
      const ProfileScreen(),
    ];

    return Scaffold(
      backgroundColor: const Color(0xFF0A101D),
      body: IndexedStack(
        index: _currentIndex,
        children: pages,
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          border: Border(
            top: BorderSide(color: Colors.white.withOpacity(0.1), width: 1),
          ),
        ),
        child: BottomNavigationBar(
          backgroundColor: const Color(0xFF15233D),
          selectedItemColor: const Color(0xFF20CDFE),
          unselectedItemColor: Colors.white54,
          currentIndex: _currentIndex,
          onTap: (index) {
            setState(() {
              _currentIndex = index;
            });
          },
          items: const [
            BottomNavigationBarItem(
              icon: Icon(Icons.home_outlined),
              activeIcon: Icon(Icons.home),
              label: 'Inicio',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.notifications_outlined),
              activeIcon: Icon(Icons.notifications),
              label: 'Avisos',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.person_outline),
              activeIcon: Icon(Icons.person),
              label: 'Perfil',
            ),
          ],
        ),
      ),
    );
  }
}
