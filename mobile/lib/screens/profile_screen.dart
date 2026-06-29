import 'package:flutter/material.dart';
import '../services/user_service.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final UserService _userService = UserService();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  
  bool _isLoading = true;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    final profile = await _userService.getProfile();
    if (profile != null && mounted) {
      setState(() {
        _nameController.text = profile['name'] ?? '';
        _emailController.text = profile['email'] ?? '';
        _isLoading = false;
      });
    }
  }

  Future<void> _saveProfile() async {
    setState(() => _isSaving = true);
    final success = await _userService.updateProfile({
      'name': _nameController.text,
      // email update might not be allowed directly in some backends, but we send it
      'email': _emailController.text,
    });
    setState(() => _isSaving = false);

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(success ? 'Perfil actualizado correctamente' : 'Error al actualizar perfil'),
          backgroundColor: success ? const Color(0xFF1ED1B4) : Colors.red,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A101D),
      appBar: AppBar(
        title: const Text('Mi Perfil', style: TextStyle(color: Colors.white)),
        backgroundColor: const Color(0xFF15233D),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF20CDFE)))
          : SingleChildScrollView(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Center(
                    child: CircleAvatar(
                      radius: 50,
                      backgroundColor: Color(0xFF15233D),
                      child: Icon(Icons.person, size: 50, color: Color(0xFF20CDFE)),
                    ),
                  ),
                  const SizedBox(height: 32),
                  const Text('Nombre Completo', style: TextStyle(color: Colors.white70)),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _nameController,
                    style: const TextStyle(color: Colors.white),
                    decoration: InputDecoration(
                      filled: true,
                      fillColor: const Color(0xFF15233D),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide.none,
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  const Text('Correo Electrónico', style: TextStyle(color: Colors.white70)),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _emailController,
                    style: const TextStyle(color: Colors.white),
                    keyboardType: TextInputType.emailAddress,
                    decoration: InputDecoration(
                      filled: true,
                      fillColor: const Color(0xFF15233D),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide.none,
                      ),
                    ),
                  ),
                  const SizedBox(height: 32),
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton(
                      onPressed: _isSaving ? null : _saveProfile,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF20CDFE),
                        foregroundColor: Colors.black,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: _isSaving
                          ? const CircularProgressIndicator(color: Colors.black)
                          : const Text(
                              'Guardar Cambios',
                              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                            ),
                    ),
                  ),
                ],
              ),
            ),
    );
  }
}
