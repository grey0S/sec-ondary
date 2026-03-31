import SwiftUI

struct ShopView: View {
    @EnvironmentObject private var session: AppSession
    @State private var shop: ShopResponse?
    @State private var msg: String?
    @State private var busy = false

    var body: some View {
        NavigationStack {
            List {
                if let shop {
                    Section {
                        Text("Rotación slot \(shop.rotationSlot) · canje con XP")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    ForEach(shop.items) { it in
                        VStack(alignment: .leading, spacing: 6) {
                            Text(it.name).font(.headline)
                            Text(it.description).font(.caption).foregroundStyle(.secondary)
                            HStack {
                                Text("\(it.costXp) XP")
                                    .foregroundStyle(Color(red: 0.75, green: 0.37, blue: 1))
                                Spacer()
                                if it.owned {
                                    Text("Tuyo").font(.caption)
                                } else {
                                    Button("Canjear") { Task { await buy(it.id) } }
                                        .disabled(busy)
                                }
                            }
                        }
                        .padding(.vertical, 4)
                    }
                } else {
                    ProgressView()
                }
                if let msg { Section { Text(msg).font(.caption) } }
            }
            .navigationTitle("Tienda")
            .task { await load() }
            .refreshable { await load() }
        }
    }

    private func load() async {
        do {
            shop = try await session.fetchShop()
            await session.refreshMe()
        } catch {
            msg = error.localizedDescription
        }
    }

    private func buy(_ id: String) async {
        busy = true
        defer { busy = false }
        do {
            try await session.buyShopItem(id: id)
            msg = "Canjeado"
            await load()
        } catch {
            msg = error.localizedDescription
        }
    }
}
