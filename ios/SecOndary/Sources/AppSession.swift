import Foundation

@MainActor
final class AppSession: ObservableObject {
    @Published var token: String?
    @Published var me: MeResponse?
    @Published var lastError: String?
    @Published var isLoading = false

    private var baseURL: String { AppConfig.apiBase }

    func loadFromKeychain() {
        token = KeychainStore.readToken()
    }

    func bootstrapIfNeeded() async {
        loadFromKeychain()
        if token != nil {
            await refreshMe()
            return
        }
        isLoading = true
        defer { isLoading = false }
        do {
            let url = URL(string: "\(baseURL)/api/auth/bootstrap")!
            var req = URLRequest(url: url)
            req.httpMethod = "POST"
            req.setValue("application/json", forHTTPHeaderField: "Content-Type")
            req.httpBody = try JSONSerialization.data(withJSONObject: ["platform": "ios"])
            let (data, response) = try await URLSession.shared.data(for: req)
            try throwIfHTTPError(data: data, response: response)
            let decoded = try JSONDecoder().decode(BootstrapResponse.self, from: data)
            guard let t = decoded.apiToken else {
                lastError = "Sin apiToken del servidor"
                return
            }
            token = t
            KeychainStore.saveToken(t)
            me = try await fetchMeRaw()
        } catch {
            lastError = error.localizedDescription
        }
    }

    func refreshMe() async {
        guard token != nil else { return }
        isLoading = true
        defer { isLoading = false }
        do {
            me = try await fetchMeRaw()
            lastError = nil
        } catch {
            lastError = error.localizedDescription
        }
    }

    private func fetchMeRaw() async throws -> MeResponse {
        let (data, response) = try await authorized(path: "/api/me", method: "GET", jsonBody: nil)
        try throwIfHTTPError(data: data, response: response)
        return try JSONDecoder().decode(MeResponse.self, from: data)
    }

    func authorized(path: String, method: String, jsonBody: [String: Any]?) async throws -> (Data, URLResponse) {
        guard let t = token else { throw URLError(.userAuthenticationRequired) }
        let url = URL(string: "\(baseURL)\(path)")!
        var req = URLRequest(url: url)
        req.httpMethod = method
        req.setValue("Bearer \(t)", forHTTPHeaderField: "Authorization")
        if let jsonBody {
            req.setValue("application/json", forHTTPHeaderField: "Content-Type")
            req.httpBody = try JSONSerialization.data(withJSONObject: jsonBody, options: [])
        }
        return try await URLSession.shared.data(for: req)
    }

    func throwIfHTTPError(data: Data, response: URLResponse) throws {
        let http = response as? HTTPURLResponse
        guard let http else { return }
        guard (200 ... 299).contains(http.statusCode) else {
            if let err = try? JSONDecoder().decode(APIErrorBody.self, from: data), let m = err.error {
                throw NSError(domain: "API", code: http.statusCode, userInfo: [NSLocalizedDescriptionKey: m])
            }
            throw NSError(domain: "API", code: http.statusCode, userInfo: [NSLocalizedDescriptionKey: "HTTP \(http.statusCode)"])
        }
    }

    func logout() {
        token = nil
        me = nil
        KeychainStore.clearToken()
    }
}
