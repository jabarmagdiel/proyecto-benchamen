import 'package:flutter/material.dart';
import '../services/departments_service.dart';
import '../models/department_model.dart';

class DepartmentsScreen extends StatefulWidget {
  final VoidCallback? onMenuPressed;
  const DepartmentsScreen({super.key, this.onMenuPressed});

  @override
  State<DepartmentsScreen> createState() => _DepartmentsScreenState();
}

class _DepartmentsScreenState extends State<DepartmentsScreen> {
  final DepartmentsService _departmentsService = DepartmentsService();
  List<DepartmentModel> _departments = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadDepartments();
  }

  Future<void> _loadDepartments() async {
    setState(() => _isLoading = true);
    try {
      final data = await _departmentsService.getDepartments();
      setState(() {
        _departments = data;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    }
  }

  void _showDepartmentModal([DepartmentModel? department]) {
    final isEditing = department != null;
    final nameController = TextEditingController(text: department?.name ?? '');
    final descController = TextEditingController(text: department?.description ?? '');

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF15233D),
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (context) {
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
                Text(isEditing ? 'Editar Departamento' : 'Nuevo Departamento', style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                const SizedBox(height: 16),
                _buildTextField('Nombre *', nameController),
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
                      if (nameController.text.isEmpty) return;
                      Navigator.pop(context);
                      setState(() => _isLoading = true);
                      try {
                        final data = {
                          'name': nameController.text,
                          'description': descController.text,
                        };
                        if (isEditing) {
                          await _departmentsService.updateDepartment(department.id, data);
                        } else {
                          await _departmentsService.createDepartment(data);
                        }
                        _loadDepartments();
                      } catch (e) {
                        setState(() => _isLoading = false);
                        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
                      }
                    },
                    child: Text(isEditing ? 'Guardar Cambios' : 'Crear Departamento', style: const TextStyle(fontWeight: FontWeight.bold)),
                  ),
                ),
                const SizedBox(height: 20),
              ],
            ),
          ),
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
        title: const Text('Departamentos', style: TextStyle(color: Colors.white)),
        backgroundColor: const Color(0xFF15233D),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF20CDFE)))
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _departments.length,
              itemBuilder: (context, index) {
                final d = _departments[index];
                return Card(
                  color: const Color(0xFF15233D),
                  margin: const EdgeInsets.only(bottom: 12),
                  child: ListTile(
                    title: Text(d.name, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                    subtitle: Text(d.description ?? 'Sin descripción', style: const TextStyle(color: Colors.white54)),
                    trailing: IconButton(
                      icon: const Icon(Icons.edit, color: Colors.white54),
                      onPressed: () => _showDepartmentModal(d),
                    ),
                  ),
                );
              },
            ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: const Color(0xFF20CDFE),
        onPressed: () => _showDepartmentModal(),
        child: const Icon(Icons.add, color: Colors.black),
      ),
    );
  }
}
