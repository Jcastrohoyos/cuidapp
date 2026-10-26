import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { fam, FontSize, Radius, Spacing, Color } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { AlertaCard } from './AlertaCard';
import type { AlertaMedica, PrioridadAlerta } from '@/types';

type FiltroTab = 'todas' | 'pendientes' | 'criticas' | 'hoy';

const TABS: { id: FiltroTab; label: string; icon: string }[] = [
  { id: 'pendientes', label: 'Pendientes', icon: '📋' },
  { id: 'criticas', label: 'Críticas', icon: '🔴' },
  { id: 'hoy', label: 'Hoy', icon: '📅' },
  { id: 'todas', label: 'Todas', icon: '📚' },
];

export interface AlertaListProps {
  alertas: AlertaMedica[];
  perfilId: string;
  onLeer: (alertaId: string) => Promise<void>;
  onDescartar: (alertaId: string) => Promise<void>;
  onPosponer: (alertaId: string, minutos: number) => Promise<void>;
  onAccion: (alerta: AlertaMedica) => void;
  onRefrescar: () => Promise<void>;
  cargando?: boolean;
  vacioMensaje?: string;
}

export function AlertaList({
  alertas,
  perfilId,
  onLeer,
  onDescartar,
  onPosponer,
  onAccion,
  onRefrescar,
  cargando = false,
  vacioMensaje = 'No hay alertas',
}: AlertaListProps) {
  const theme = useTheme();
  const [tabActiva, setTabActiva] = useState<FiltroTab>('pendientes');
  const flatListRef = useRef<FlatList<AlertaMedica>>(null);

  const alertasFiltradas = useMemo(() => {
    const ahora = new Date();
    const inicioHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
    const finHoy = new Date(inicioHoy.getTime() + 24 * 60 * 60 * 1000);

    switch (tabActiva) {
      case 'pendientes':
        return alertas.filter((a) => !a.leida && !a.descartada);
      case 'criticas':
        return alertas.filter((a) => a.prioridad === 'critica' && !a.leida && !a.descartada);
      case 'hoy':
        return alertas.filter((a) => {
          const fecha = new Date(a.fechaHora);
          return fecha >= inicioHoy && fecha < finHoy && !a.leida && !a.descartada;
        });
      case 'todas':
      default:
        return alertas;
    }
  }, [alertas, tabActiva]);

  const conteoPendientes = useMemo(() => {
    return alertas.filter((a) => !a.leida && !a.descartada).length;
  }, [alertas]);

  const conteoCriticas = useMemo(() => {
    return alertas.filter((a) => a.prioridad === 'critica' && !a.leida && !a.descartada).length;
  }, [alertas]);

  const handleRefrescar = useCallback(async () => {
    await onRefrescar();
  }, [onRefrescar]);

  const renderItem = useCallback(
    ({ item }: { item: AlertaMedica }) => (
      <AlertaCard
        key={item.id}
        alerta={item}
        onLeer={() => onLeer(item.id)}
        onDescartar={() => onDescartar(item.id)}
        onPosponer={(min) => onPosponer(item.id, min)}
        onAccion={() => onAccion(item)}
      />
    ),
    [onLeer, onDescartar, onPosponer, onAccion]
  );

  const renderEmpty = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyIcon, { color: Color.gray500 }]}>📭</Text>
      <ThemedText style={[styles.emptyTitle, { color: theme.textSecondary }]}>
        {vacioMensaje}
      </ThemedText>
      <ThemedText style={[styles.emptySubtitle, { color: Color.gray500 }]}>
        Las alertas aparecerán aquí cuando se programen
      </ThemedText>
    </View>
  ), [vacioMensaje, theme]);

  return (
    <View style={styles.container}>
      {/* Header con tabs */}
      <View style={styles.header}>
        <View style={styles.headerMain}>
          <ThemedText style={[styles.headerTitle, { color: theme.text }]}>Alertas</ThemedText>
          {conteoPendientes > 0 && (
            <View style={styles.badge}>
              <ThemedText style={styles.badgeText}>{conteoPendientes}</ThemedText>
            </View>
          )}
        </View>
      </View>

      {/* Tabs de filtro */}
      <View style={styles.tabsContainer}>
        {TABS.map((tab) => {
          const count = tab.id === 'pendientes'
            ? conteoPendientes
            : tab.id === 'criticas'
              ? conteoCriticas
              : undefined;
          const isActive = tabActiva === tab.id;

          return (
            <Pressable
              key={tab.id}
              style={[
                styles.tab,
                isActive && styles.tabActive,
              ]}
              onPress={() => setTabActiva(tab.id)}
              hitSlop={8}
            >
              <Text style={[
                styles.tabIcon,
                isActive && styles.tabIconActive,
              ]}>{tab.icon}</Text>
              <ThemedText style={[
                styles.tabLabel,
                isActive && styles.tabLabelActive,
                count !== undefined && count > 0 && styles.tabLabelWithBadge,
              ]}>
                {tab.label}
                {count !== undefined && count > 0 && (
                  <ThemedText style={styles.tabBadge}>{count}</ThemedText>
                )}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      {/* Lista de alertas */}
      <FlatList
        ref={flatListRef}
        data={alertasFiltradas}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={cargando}
            onRefresh={handleRefrescar}
            colors={[theme.primary]}
            progressViewOffset={60}
          />
        }
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
          autoscrollToTopThreshold: 10,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Color.gray50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: Color.gray200,
  },
  headerMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  headerTitle: {
    fontFamily: fam(700),
    fontSize: FontSize.xl,
  },
  badge: {
    backgroundColor: Color.red500,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: {
    fontFamily: fam(700),
    fontSize: FontSize.xs,
    color: '#fff',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    gap: Spacing.two,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: Color.gray100,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Radius.full,
    backgroundColor: Color.gray100,
    flex: 1,
    justifyContent: 'center',
  },
  tabActive: {
    backgroundColor: Color.teal600,
  },
  tabIcon: {
    fontSize: 16,
  },
  tabIconActive: {
    // color handled by background
  },
  tabLabel: {
    fontFamily: fam(500),
    fontSize: FontSize.xs,
    color: Color.gray600,
  },
  tabLabelActive: {
    color: '#fff',
    fontWeight: '700',
  },
  tabLabelWithBadge: {
    // spacing for badge
  },
  tabBadge: {
    fontFamily: fam(700),
    fontSize: 10,
    color: '#fff',
    backgroundColor: Color.red500,
    borderRadius: Radius.full,
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginLeft: 2,
    minWidth: 16,
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: Spacing.six,
    paddingHorizontal: Spacing.three,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.six,
    gap: Spacing.three,
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyTitle: {
    fontFamily: fam(600),
    fontSize: FontSize.lg,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: fam(400),
    fontSize: FontSize.md,
    textAlign: 'center',
  },
});

export type { FiltroTab };