import 'package:flutter/material.dart';
import '../services/activity_service.dart';
import '../services/projects_service.dart';
import '../models/activity.dart';
import '../models/project.dart';
import 'activity_detail_screen.dart';

class ActivitiesAdminScreen extends StatefulWidget {
  final VoidCallback? onMenuPressed;
  const ActivitiesAdminScreen({super.key, this.onMenuPressed});

  @override
  State<ActivitiesAdminScreen> createState() => _ActivitiesAdminScreenState();
}

class _ActivitiesAdminScreenState extends State<ActivitiesAdminScreen> {
  final ActivityService _activityService = ActivityService();
  final ProjectsService _projectsService = ProjectsService();
  
  List<Activity> _activities = [];
  List<Project> _projects = [];
  bool _isLoading = true;
  String _filterStatus = '';

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      final params = _filterStatus.isNotEmpty ? {'status': _filterStatus} : <String, dynamic>{};
      final activities = await _activityService.getAllActivities(params: params);
      final projects = await _projectsService.getProjects();
      setState(() {
        _activities = activities;
        _projects = projects;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    }
  }

  void _showActivityModal([Activity? activity]) {
    final isEditing = activity != null;
    final titleController = TextEditingController(text: activity?.title ?? '');
    final descController = TextEditingController(text: activity?.description ?? '');
    int? selectedProjectId = activity?.projectId;

    if (!isEditing && _projects.isNotEmpty) {
      selectedProjectId = _projects.first.id;
    }

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF15233D),
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Padding(
              padding: EdgeInsets.only(
                bottom: MediaQuery.of(context).viewInsets.bottom,
                left: 20, right: 20, top: 20,
              ),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(isEditing ? 'Editar Actividad' : 'Nueva Actividad', style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 16),
                    
                    const Text('Proyecto *', style: TextStyle(color: Colors.white54, fontSize: 12)),
                    const SizedBox(height: 4),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      decoration: BoxDecoration(color: const Color(0xFF0A101D), borderRadius: BorderRadius.circular(12)),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<int>(
                          value: selectedProjectId,
                          isExpanded: true,
                          dropdownColor: const Color(0xFF0A101D),
                          style: const TextStyle(color: Colors.white),
                          items: _projects.map((p) => DropdownMenuItem<int>(value: p.id, child: Text(p.name))).toList(),
                          onChanged: (val) => setModalState(() => selectedProjectId = val),
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    
                    _buildTextField('Título *', titleController),
                    _buildTextField('Descripción', descController),
                    
                    const SizedBox(height: 20),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF20CDFE),
                          foregroundColor: Colors.black,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        onPressed: () async {
                          if (titleController.text.isEmpty || selectedProjectId == null) return;
                          Navigator.pop(context);
                          setState(() => _isLoading = true);
                          try {
                            final data = {
                              'title': titleController.text,
                              'description': descController.text,
                              'project_id': selectedProjectId,
                            };
                            if (isEditing) {
                              await _activityService.updateActivity(activity.id, data);
                            } else {
                              await _activityService.createActivity(data);
                            }
                            _loadData();
                          } catch (e) {
                            setState(() => _isLoading = false);
                            ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
                          }
                        },
                        child: Text(isEditing ? 'Guardar Cambios' : 'Crear Actividad', style: const TextStyle(fontWeight: FontWeight.bold)),
                      ),
                    ),
                    const SizedBox(height: 20),
                  ],
                ),
              ),
            );
          }
        );
      },
    );
  }

  Widget _buildTextField(String label, TextEditingController controller) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextField(
        controller: controller,
        style: const TextStyle(color: Colors.white),
        decoration: InputDecoration(
          labelText: label,
          labelStyle: const TextStyle(color: Colors.white54),
          filled: true,
          fillColor: const Color(0xFF0A101D),
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A101D),
      appBar: AppBar(
        leading: widget.onMenuPressed != null 
          ? IconButton(icon: const Icon(Icons.menu, color: Colors.white), onPressed: widget.onMenuPressed)
          : null,
        title: const Text('Todas las Actividades', style: TextStyle(color: Colors.white, fontSize: 18)),
        backgroundColor: const Color(0xFF15233D),
        actions: [
          PopupMenuButton<String>(
            icon: const Icon(Icons.filter_list, color: Colors.white),
            onSelected: (val) {
              setState(() => _filterStatus = val);
              _loadData();
            },
            itemBuilder: (context) => [
              const PopupMenuItem(value: '', child: Text('Todos')),
              const PopupMenuItem(value: 'pendiente', child: Text('Pendientes')),
              const PopupMenuItem(value: 'en_proceso', child: Text('En Progreso')),
              const PopupMenuItem(value: 'en_revision', child: Text('En Revisión')),
              const PopupMenuItem(value: 'aprobada', child: Text('Completadas')),
            ],
          )
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF20CDFE)))
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _activities.length,
              itemBuilder: (context, index) {
                final a = _activities[index];
                return Card(
                  color: const Color(0xFF15233D),
                  margin: const EdgeInsets.only(bottom: 12),
                  child: ListTile(
                    onTap: () {
                      Navigator.push(context, MaterialPageRoute(builder: (_) => ActivityDetailScreen(activity: a)));
                    },
                    title: Text(a.title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                    subtitle: Text('${a.projectName ?? "Sin proyecto"} • ${a.companyName ?? "Sin empresa"}', style: const TextStyle(color: Colors.white54)),
                    trailing: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(color: const Color(0xFF20CDFE).withOpacity(0.2), borderRadius: BorderRadius.circular(4)),
                          child: Text(a.status.toUpperCase(), style: const TextStyle(color: Color(0xFF20CDFE), fontSize: 9, fontWeight: FontWeight.bold)),
                        ),
                        IconButton(
                          icon: const Icon(Icons.edit, color: Colors.white54, size: 20),
                          onPressed: () => _showActivityModal(a),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: const Color(0xFF20CDFE),
        onPressed: () => _showActivityModal(),
        child: const Icon(Icons.add, color: Colors.black),
      ),
    );
  }
}
