import Foundation

enum AppConfig {
    /// URL del backend Next.js (Vercel o `http://IP-LAN:3000` en desarrollo).
    static var apiBase: String {
        let raw = Bundle.main.object(forInfoDictionaryKey: "API_BASE_URL") as? String ?? ""
        let trimmed = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        if trimmed.isEmpty { return "http://127.0.0.1:3000" }
        return trimmed.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
    }
}
