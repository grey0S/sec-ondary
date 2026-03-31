import SwiftUI

struct ContentView: View {
    @EnvironmentObject private var session: AppSession

    var body: some View {
        Group {
            if session.token == nil && session.isLoading {
                ProgressView("Conectando…")
                    .tint(Color(red: 0, green: 0.96, blue: 0.78))
            } else if let err = session.lastError, session.me == nil {
                VStack(spacing: 16) {
                    Text(err).multilineTextAlignment(.center).foregroundStyle(.secondary)
                    Text("Revisá API_BASE_URL en Info.plist (IP de tu Mac o URL de Vercel).")
                        .font(.caption)
                        .foregroundStyle(.tertiary)
                        .multilineTextAlignment(.center)
                    Button("Reintentar") {
                        Task { await session.bootstrapIfNeeded() }
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(Color(red: 0, green: 0.96, blue: 0.78))
                }
                .padding()
            } else {
                TabView {
                    HomeView()
                        .tabItem { Label("Base", systemImage: "gamecontroller.fill") }
                    SocialView()
                        .tabItem { Label("Social", systemImage: "person.2.fill") }
                    ShopView()
                        .tabItem { Label("Tienda", systemImage: "bag.fill") }
                    DuelView()
                        .tabItem { Label("2vs2", systemImage: "flag.fill") }
                    ProfileView()
                        .tabItem { Label("Perfil", systemImage: "person.crop.circle") }
                }
                .tint(Color(red: 0, green: 0.96, blue: 0.78))
            }
        }
        .task {
            await session.bootstrapIfNeeded()
        }
    }
}
