import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/auth_service.dart';
import 'operative_screen.dart';
import 'admin_screen.dart';
import 'profile_screen.dart';
import 'companies_screen.dart';
import 'projects_screen.dart';
import 'activities_admin_screen.dart';
import 'dashboard_screen.dart';
import 'users_screen.dart';
import 'departments_screen.dart';
import 'packages_screen.dart';
import 'agenda_screen.dart';
import 'notifications_screen.dart';

import '../services/websocket_service.dart';

class HomeLayout extends StatefulWidget {
  const HomeLayout({super.key});

  @override
  State<HomeLayout> createState() => _HomeLayoutState();
}

class _HomeLayoutState extends State<HomeLayout> {
  int _currentIndex = 0;
  // Index para la navegación del drawer (solo usado si _currentIndex == 0)
  int _drawerIndex = 0; 
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  @override
  void initState() {
    super.initState();
    WebSocketService().connect();
  }

  @override
  Widget build(BuildContext context) {
    final authService = Provider.of<AuthService>(context);
    final role = authService.role?.toLowerCase() ?? 'operativo';
    
    final isAdmin = role == 'admin' || role == 'administrador';
    final isClient = role == 'cliente' || role == 'empresa';
    final isOperative = role == 'operativo';

    // Función para abrir el drawer
    void openDrawer() {
      _scaffoldKey.currentState?.openDrawer();
    }

    // Construir la vista principal dependiendo del rol y la selección del drawer
    Widget mainView;
    if (isAdmin) {
      switch (_drawerIndex) {
        case 0: mainView = AdminScreen(onMenuPressed: openDrawer); break; // Aprobaciones
        case 1: mainView = DashboardScreen(onMenuPressed: openDrawer); break;
        case 2: mainView = CompaniesScreen(onMenuPressed: openDrawer); break;
        case 3: mainView = ProjectsScreen(onMenuPressed: openDrawer); break;
        case 4: mainView = ActivitiesAdminScreen(onMenuPressed: openDrawer); break;
        case 5: mainView = AgendaScreen(onMenuPressed: openDrawer); break;
        case 6: mainView = UsersScreen(onMenuPressed: openDrawer); break;
        case 7: mainView = DepartmentsScreen(onMenuPressed: openDrawer); break;
        case 8: mainView = PackagesScreen(onMenuPressed: openDrawer); break;
        default: mainView = AdminScreen(onMenuPressed: openDrawer);
      }
    } else if (isClient) {
      switch (_drawerIndex) {
        case 0: mainView = AdminScreen(onMenuPressed: openDrawer); break; // Aprobaciones de su empresa
        case 1: mainView = AgendaScreen(onMenuPressed: openDrawer); break; // Calendario / Agenda
        case 2: mainView = DashboardScreen(onMenuPressed: openDrawer); break; // Portal Cliente
        default: mainView = AdminScreen(onMenuPressed: openDrawer);
      }
    } else {
      mainView = OperativeScreen(onMenuPressed: openDrawer); // Operativos no cambian vista
    }

    // Páginas del BottomNavigationBar
    final List<Widget> pages = [
      mainView,
      const NotificationsScreen(),
      const ProfileScreen(),
    ];

    return Scaffold(
      key: _scaffoldKey,
      backgroundColor: const Color(0xFF0A101D),
      drawer: _buildDrawer(isAdmin, isClient, isOperative),
      body: IndexedStack(
        index: _currentIndex,
        children: pages,
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          border: Border(top: BorderSide(color: Colors.white.withOpacity(0.1), width: 1)),
        ),
        child: BottomNavigationBar(
          backgroundColor: const Color(0xFF15233D),
          selectedItemColor: const Color(0xFF20CDFE),
          unselectedItemColor: Colors.white54,
          currentIndex: _currentIndex,
          onTap: (index) {
            setState(() { _currentIndex = index; });
          },
          items: const [
            BottomNavigationBarItem(icon: Icon(Icons.home_outlined), activeIcon: Icon(Icons.home), label: 'Inicio'),
            BottomNavigationBarItem(icon: Icon(Icons.notifications_outlined), activeIcon: Icon(Icons.notifications), label: 'Avisos'),
            BottomNavigationBarItem(icon: Icon(Icons.person_outline), activeIcon: Icon(Icons.person), label: 'Perfil'),
          ],
        ),
      ),
    );
  }

  Widget _buildDrawer(bool isAdmin, bool isClient, bool isOperative) {
    return Drawer(
      backgroundColor: const Color(0xFF15233D),
      child: Column(
        children: [
          UserAccountsDrawerHeader(
            decoration: const BoxDecoration(color: Color(0xFF0A101D)),
            accountName: const Text('Alfa Prestige', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 18)),
            accountEmail: Text(isAdmin ? 'Administrador' : isClient ? 'Portal Cliente' : 'Operativo', style: const TextStyle(color: Color(0xFF20CDFE))),
            currentAccountPicture: const CircleAvatar(
              backgroundColor: Color(0xFF20CDFE),
              child: Icon(Icons.person, color: Colors.black, size: 40),
            ),
          ),
          Expanded(
            child: ListView(
              padding: EdgeInsets.zero,
              children: [
                if (isAdmin) ...[
                  _drawerItem(0, Icons.check_circle_outline, 'Aprobaciones'),
                  _drawerItem(1, Icons.dashboard_outlined, 'Dashboard'),
                  _drawerItem(2, Icons.business_outlined, 'Empresas'),
                  _drawerItem(3, Icons.folder_outlined, 'Proyectos'),
                  _drawerItem(4, Icons.task_alt_outlined, 'Todas las Actividades'),
                  _drawerItem(5, Icons.calendar_month_outlined, 'Calendario / Agenda'),
                  const Divider(color: Colors.white10),
                  _drawerItem(6, Icons.people_outline, 'Usuarios'),
                  _drawerItem(7, Icons.domain_outlined, 'Departamentos'),
                  _drawerItem(8, Icons.inventory_2_outlined, 'Paquetes'),
                ] else if (isClient) ...[
                  _drawerItem(0, Icons.check_circle_outline, 'Aprobaciones'),
                  _drawerItem(1, Icons.calendar_month_outlined, 'Calendario / Agenda'),
                  _drawerItem(2, Icons.dashboard_outlined, 'Mi Portal'),
                ] else ...[
                  _drawerItem(0, Icons.list_alt, 'Mis Actividades'),
                ]
              ],
            ),
          ),
          const Divider(color: Colors.white10),
          ListTile(
            leading: const Icon(Icons.logout, color: Colors.redAccent),
            title: const Text('Cerrar Sesión', style: TextStyle(color: Colors.redAccent)),
            onTap: () {
              Provider.of<AuthService>(context, listen: false).logout();
            },
          ),
          const SizedBox(height: 20),
        ],
      ),
    );
  }

  Widget _drawerItem(int index, IconData icon, String title) {
    final isSelected = _drawerIndex == index && _currentIndex == 0;
    return ListTile(
      leading: Icon(icon, color: isSelected ? const Color(0xFF20CDFE) : Colors.white70),
      title: Text(
        title,
        style: TextStyle(
          color: isSelected ? const Color(0xFF20CDFE) : Colors.white70,
          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
        ),
      ),
      selected: isSelected,
      selectedTileColor: const Color(0xFF20CDFE).withOpacity(0.1),
      onTap: () {
        setState(() {
          _drawerIndex = index;
          _currentIndex = 0; // Cambiar a la pestaña de "Inicio" si estaba en Notificaciones o Perfil
        });
        Navigator.pop(context); // Cerrar el drawer
      },
    );
  }
}
