import 'package:flutter/material.dart';
import '../services/users_service.dart';
import '../models/user_model.dart';

class UsersScreen extends StatefulWidget {
  final VoidCallback? onMenuPressed;
  const UsersScreen({super.key, this.onMenuPressed});

  @override
  State<UsersScreen> createState() => _UsersScreenState();
}

class _UsersScreenState extends State<UsersScreen> {
  final UsersService _usersService = UsersService();
  List<UserModel> _users = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadUsers();
  }

  Future<void> _loadUsers() async {
    setState(() => _isLoading = true);
    try {
      final users = await _usersService.getUsers();
      setState(() {
        _users = users;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    }
  }

  void _showUserModal([UserModel? user]) {
    final isEditing = user != null;
    final nameController = TextEditingController(text: user?.name ?? '');
    final emailController = TextEditingController(text: user?.email ?? '');
    String selectedRole = user?.role ?? 'operativo';
    final passwordController = TextEditingController();

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
                    Text(isEditing ? 'Editar Usuario' : 'Nuevo Usuario', style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 16),
                    
                    _buildTextField('Nombre *', nameController),
                    _buildTextField('Correo (Email) *', emailController),
                    if (!isEditing) _buildTextField('Contraseña *', passwordController, isPassword: true),
                    
                    const Text('Rol *', style: TextStyle(color: Colors.white54, fontSize: 12)),
                    const SizedBox(height: 4),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      decoration: BoxDecoration(color: const Color(0xFF0A101D), borderRadius: BorderRadius.circular(12)),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<String>(
                          value: selectedRole,
                          isExpanded: true,
                          dropdownColor: const Color(0xFF0A101D),
                          style: const TextStyle(color: Colors.white),
                          items: ['admin', 'operativo', 'empresa'].map((r) => DropdownMenuItem(value: r, child: Text(r.toUpperCase()))).toList(),
                          onChanged: (val) {
                            if (val != null) setModalState(() => selectedRole = val);
                          },
                        ),
                      ),
                    ),
                    
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
                          if (nameController.text.isEmpty || emailController.text.isEmpty) return;
                          Navigator.pop(context);
                          setState(() => _isLoading = true);
                          try {
                            final data = {
                              'name': nameController.text,
                              'email': emailController.text,
                              'role': selectedRole,
                            };
                            if (!isEditing) {
                              if (passwordController.text.isEmpty) throw Exception('Contraseña requerida');
                              data['password'] = passwordController.text;
                            }
                            if (isEditing) {
                              await _usersService.updateUser(user.id, data);
                            } else {
                              await _usersService.createUser(data);
                            }
                            _loadUsers();
                          } catch (e) {
                            setState(() => _isLoading = false);
                            ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
                          }
                        },
                        child: Text(isEditing ? 'Guardar Cambios' : 'Crear Usuario', style: const TextStyle(fontWeight: FontWeight.bold)),
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

  Widget _buildTextField(String label, TextEditingController controller, {bool isPassword = false}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextField(
        controller: controller,
        obscureText: isPassword,
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
        title: const Text('Usuarios', style: TextStyle(color: Colors.white)),
        backgroundColor: const Color(0xFF15233D),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF20CDFE)))
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _users.length,
              itemBuilder: (context, index) {
                final u = _users[index];
                return Card(
                  color: const Color(0xFF15233D),
                  margin: const EdgeInsets.only(bottom: 12),
                  child: ListTile(
                    title: Text(u.name, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                    subtitle: Text(u.email, style: const TextStyle(color: Colors.white54)),
                    trailing: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(color: const Color(0xFF20CDFE).withOpacity(0.2), borderRadius: BorderRadius.circular(4)),
                          child: Text(u.role.toUpperCase(), style: const TextStyle(color: Color(0xFF20CDFE), fontSize: 10, fontWeight: FontWeight.bold)),
                        ),
                        const SizedBox(width: 8),
                        IconButton(
                          icon: const Icon(Icons.edit, color: Colors.white54),
                          onPressed: () => _showUserModal(u),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: const Color(0xFF20CDFE),
        onPressed: () => _showUserModal(),
        child: const Icon(Icons.add, color: Colors.black),
      ),
    );
  }
}
