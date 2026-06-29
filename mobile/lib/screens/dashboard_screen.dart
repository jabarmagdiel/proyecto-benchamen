import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../services/auth_service.dart';
import '../services/activity_service.dart';
import '../services/projects_service.dart';

class DashboardScreen extends StatefulWidget {
  final VoidCallback? onMenuPressed;
  const DashboardScreen({super.key, this.onMenuPressed});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final ActivityService _activityService = ActivityService();
  final ProjectsService _projectsService = ProjectsService();
  
  bool _isLoading = true;
  int _totalProjects = 0;
  int _pendingActivities = 0;
  int _completedActivities = 0;

  @override
  void initState() {
    super.initState();
    _loadDashboardData();
  }

  Future<void> _loadDashboardData() async {
    final authService = Provider.of<AuthService>(context, listen: false);
    final role = authService.role?.toLowerCase();
    
    if (role == 'admin' || role == 'administrador') {
      try {
        final projects = await _projectsService.getProjects();
        final activities = await _activityService.getAllActivities();
        
        setState(() {
          _totalProjects = projects.length;
          _pendingActivities = activities.where((a) => a.status != 'aprobada').length;
          _completedActivities = activities.where((a) => a.status == 'aprobada').length;
          _isLoading = false;
        });
      } catch (e) {
        setState(() => _isLoading = false);
      }
    } else {
      // Cliente dashboard data (placeholder)
      setState(() => _isLoading = false);
    }
  }

  Future<void> _openLookerStudio() async {
    final authService = Provider.of<AuthService>(context, listen: false);
    // En el futuro, sacar la URL del dashboard_url de la empresa del cliente
    final Uri url = Uri.parse('https://lookerstudio.google.com/reporting'); 
    if (!await launchUrl(url)) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('No se pudo abrir el reporte')));
    }
  }

  @override
  Widget build(BuildContext context) {
    final authService = Provider.of<AuthService>(context);
    final role = authService.role?.toLowerCase() ?? '';
    final isAdmin = role == 'admin' || role == 'administrador';

    return Scaffold(
      backgroundColor: const Color(0xFF0A101D),
      appBar: AppBar(
        leading: widget.onMenuPressed != null 
          ? IconButton(icon: const Icon(Icons.menu, color: Colors.white), onPressed: widget.onMenuPressed)
          : null,
        title: Text(isAdmin ? 'Dashboard Admin' : 'Mi Rendimiento', style: const TextStyle(color: Colors.white)),
        backgroundColor: const Color(0xFF15233D),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF20CDFE)))
          : isAdmin 
              ? _buildAdminDashboard() 
              : _buildClientDashboard(),
    );
  }

  Widget _buildAdminDashboard() {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Resumen General', style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(child: _buildMetricCard('Proyectos', _totalProjects.toString(), Icons.folder, Colors.blue)),
              const SizedBox(width: 16),
              Expanded(child: _buildMetricCard('Actividades Pendientes', _pendingActivities.toString(), Icons.pending_actions, Colors.orange)),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(child: _buildMetricCard('Actividades Completadas', _completedActivities.toString(), Icons.check_circle, Colors.green)),
              const SizedBox(width: 16),
              Expanded(child: Container()), // Spacer
            ],
          )
        ],
      ),
    );
  }

  Widget _buildClientDashboard() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.analytics_outlined, color: Color(0xFF20CDFE), size: 80),
            const SizedBox(height: 20),
            const Text(
              'Panel de Rendimiento',
              style: TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            const Text(
              'Consulta las métricas en tiempo real de tu estrategia de marketing a través de tu panel interactivo de Looker Studio.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.white70, fontSize: 16),
            ),
            const SizedBox(height: 30),
            ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF20CDFE),
                foregroundColor: Colors.black,
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              onPressed: _openLookerStudio,
              icon: const Icon(Icons.open_in_new),
              label: const Text('Abrir Reporte', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            )
          ],
        ),
      ),
    );
  }

  Widget _buildMetricCard(String title, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF15233D),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 32),
          const SizedBox(height: 12),
          Text(value, style: const TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.bold)),
          const SizedBox(height: 4),
          Text(title, style: const TextStyle(color: Colors.white70, fontSize: 12)),
        ],
      ),
    );
  }
}
