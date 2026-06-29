import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/auth_service.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;

  Future<void> _login() async {
    setState(() => _isLoading = true);
    final authService = Provider.of<AuthService>(context, listen: false);
    
    final success = await authService.login(
      _emailController.text,
      _passwordController.text,
    );
    
    setState(() => _isLoading = false);
    
    if (!success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Error al iniciar sesión. Revisa tus credenciales.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A101D), // Dark background matching web
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Logo
              Container(
                width: double.infinity,
                height: 100,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Image.asset(
                  'assets/images/logo.png',
                  fit: BoxFit.contain,
                ),
              ),
              const SizedBox(height: 48),
              
              // Email input
              TextField(
                controller: _emailController,
                style: const TextStyle(color: Colors.white),
                decoration: InputDecoration(
                  labelText: 'Correo Electrónico',
                  labelStyle: const TextStyle(color: Colors.white54),
                  filled: true,
                  fillColor: const Color(0xFF15233D),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide.none,
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: Color(0xFF20CDFE)),
                  ),
                ),
                keyboardType: TextInputType.emailAddress,
              ),
              const SizedBox(height: 16),
              
              // Password input
              TextField(
                controller: _passwordController,
                style: const TextStyle(color: Colors.white),
                decoration: InputDecoration(
                  labelText: 'Contraseña',
                  labelStyle: const TextStyle(color: Colors.white54),
                  filled: true,
                  fillColor: const Color(0xFF15233D),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide.none,
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: Color(0xFF20CDFE)),
                  ),
                ),
                obscureText: true,
              ),
              const SizedBox(height: 32),
              
              // Login button
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _login,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF20CDFE),
                    foregroundColor: Colors.black,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: _isLoading 
                    ? const CircularProgressIndicator(color: Colors.black)
                    : const Text(
                        'Iniciar Sesión',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                      ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
