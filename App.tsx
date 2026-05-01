/**
 * Apple-style CRUD Notes app
 *
 * @format
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Note = {
  id: string;
  title: string;
  body: string;
  createdAt: number;
  updatedAt: number;
  pinned: boolean;
};

const STORAGE_KEY = '@apple_style_crud_notes_v1';

const palette = {
  light: {
    background: '#F2F2F7',
    grouped: '#FFFFFF',
    separator: 'rgba(60,60,67,0.18)',
    label: '#000000',
    secondary: '#3C3C4399',
    tertiary: '#3C3C4366',
    accent: '#007AFF',
    danger: '#FF3B30',
    chrome: 'rgba(242,242,247,0.85)',
    overlay: 'rgba(0,0,0,0.35)',
    field: '#FFFFFF',
    placeholder: '#3C3C434C',
  },
  dark: {
    background: '#000000',
    grouped: '#1C1C1E',
    separator: 'rgba(84,84,88,0.65)',
    label: '#FFFFFF',
    secondary: '#EBEBF599',
    tertiary: '#EBEBF566',
    accent: '#0A84FF',
    danger: '#FF453A',
    chrome: 'rgba(28,28,30,0.85)',
    overlay: 'rgba(0,0,0,0.6)',
    field: '#1C1C1E',
    placeholder: '#EBEBF54C',
  },
};

const fontFamily = Platform.select({ ios: 'System', android: 'sans-serif' });

function uid(): string {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 9)
  );
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) {
    return d.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    });
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate();
  if (isYesterday) return 'Yesterday';
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: d.getFullYear() === now.getFullYear() ? undefined : 'numeric',
  });
}

function App() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const c = isDark ? palette.dark : palette.light;

  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={c.background}
      />
      <NotesScreen />
    </SafeAreaProvider>
  );
}

function NotesScreen() {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const c = isDark ? palette.dark : palette.light;

  const [notes, setNotes] = useState<Note[]>([]);
  const [query, setQuery] = useState('');
  const [editor, setEditor] = useState<{
    visible: boolean;
    note: Note | null;
  }>({ visible: false, note: null });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Note[];
          if (Array.isArray(parsed)) setNotes(parsed);
        } else {
          const seed: Note[] = [
            {
              id: uid(),
              title: 'Welcome',
              body:
                'This is a CRUD demo with an Apple-inspired UI.\n\n• Tap + to create\n• Tap a row to edit\n• Swipe-style actions via the trailing buttons\n• Pull on a row to pin/unpin',
              createdAt: Date.now(),
              updatedAt: Date.now(),
              pinned: true,
            },
            {
              id: uid(),
              title: 'Groceries',
              body: 'Milk\nEggs\nSourdough\nApples',
              createdAt: Date.now() - 1000 * 60 * 60 * 26,
              updatedAt: Date.now() - 1000 * 60 * 60 * 26,
              pinned: false,
            },
          ];
          setNotes(seed);
        }
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(notes)).catch(() => {});
  }, [notes, loaded]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? notes.filter(
          n =>
            n.title.toLowerCase().includes(q) ||
            n.body.toLowerCase().includes(q),
        )
      : notes;
    return [...list].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return b.updatedAt - a.updatedAt;
    });
  }, [notes, query]);

  const onCreate = useCallback(() => {
    setEditor({ visible: true, note: null });
  }, []);

  const onEdit = useCallback((note: Note) => {
    setEditor({ visible: true, note });
  }, []);

  const onSave = useCallback(
    (draft: { id?: string; title: string; body: string }) => {
      const ts = Date.now();
      if (draft.id) {
        setNotes(prev =>
          prev.map(n =>
            n.id === draft.id
              ? { ...n, title: draft.title, body: draft.body, updatedAt: ts }
              : n,
          ),
        );
      } else {
        setNotes(prev => [
          {
            id: uid(),
            title: draft.title,
            body: draft.body,
            createdAt: ts,
            updatedAt: ts,
            pinned: false,
          },
          ...prev,
        ]);
      }
      setEditor({ visible: false, note: null });
    },
    [],
  );

  const onDelete = useCallback((note: Note) => {
    Alert.alert('Delete Note', `Delete "${note.title || 'Untitled'}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          setNotes(prev => prev.filter(n => n.id !== note.id)),
      },
    ]);
  }, []);

  const onTogglePin = useCallback((note: Note) => {
    setNotes(prev =>
      prev.map(n => (n.id === note.id ? { ...n, pinned: !n.pinned } : n)),
    );
  }, []);

  const pinnedCount = useMemo(
    () => filtered.filter(n => n.pinned).length,
    [filtered],
  );

  return (
    <View style={[styles.flex, { backgroundColor: c.background }]}>
      <View style={[styles.headerWrap, { paddingTop: insets.top }]}>
        <View style={styles.headerRow}>
          <Text style={[styles.largeTitle, { color: c.label }]}>Notes</Text>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="New Note"
            onPress={onCreate}
            hitSlop={12}
            style={styles.addBtn}>
            <Text style={[styles.addGlyph, { color: c.accent }]}>＋</Text>
          </TouchableOpacity>
        </View>
        <View style={[styles.searchField, { backgroundColor: c.field }]}>
          <Text style={[styles.searchGlyph, { color: c.tertiary }]}>⌕</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search"
            placeholderTextColor={c.placeholder}
            style={[styles.searchInput, { color: c.label }]}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {query.length > 0 && Platform.OS !== 'ios' ? (
            <TouchableOpacity onPress={() => setQuery('')} hitSlop={10}>
              <Text style={[styles.clearGlyph, { color: c.tertiary }]}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 32 },
        ]}
        ListEmptyComponent={
          loaded ? (
            <View style={styles.empty}>
              <Text style={[styles.emptyTitle, { color: c.label }]}>
                {query ? 'No Results' : 'No Notes'}
              </Text>
              <Text style={[styles.emptyBody, { color: c.secondary }]}>
                {query
                  ? 'Try a different search.'
                  : 'Tap + to create your first note.'}
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item, index }) => {
          const isFirstUnpinnedAfterPinned =
            pinnedCount > 0 && index === pinnedCount;
          return (
            <>
              {index === 0 && pinnedCount > 0 ? (
                <Text style={[styles.sectionHeader, { color: c.secondary }]}>
                  PINNED
                </Text>
              ) : null}
              {isFirstUnpinnedAfterPinned ? (
                <Text style={[styles.sectionHeader, { color: c.secondary }]}>
                  NOTES
                </Text>
              ) : null}
              <NoteRow
                note={item}
                colors={c}
                onPress={() => onEdit(item)}
                onDelete={() => onDelete(item)}
                onTogglePin={() => onTogglePin(item)}
                isLast={
                  index === filtered.length - 1 ||
                  (item.pinned && !filtered[index + 1]?.pinned)
                }
              />
            </>
          );
        }}
      />

      <EditorModal
        visible={editor.visible}
        note={editor.note}
        onClose={() => setEditor({ visible: false, note: null })}
        onSave={onSave}
        onDelete={editor.note ? () => onDelete(editor.note!) : undefined}
        colors={c}
        isDark={isDark}
      />
    </View>
  );
}

function NoteRow({
  note,
  colors,
  onPress,
  onDelete,
  onTogglePin,
  isLast,
}: {
  note: Note;
  colors: typeof palette.light;
  onPress: () => void;
  onDelete: () => void;
  onTogglePin: () => void;
  isLast: boolean;
}) {
  return (
    <View style={[styles.rowGroup, { backgroundColor: colors.grouped }]}>
      <Pressable
        onPress={onPress}
        android_ripple={{ color: colors.separator }}
        style={({ pressed }) => [
          styles.row,
          pressed && Platform.OS === 'ios' ? { opacity: 0.6 } : null,
        ]}>
        <View style={styles.rowMain}>
          <View style={styles.rowTitleLine}>
            {note.pinned ? (
              <Text style={[styles.pinGlyph, { color: colors.accent }]}>📌</Text>
            ) : null}
            <Text
              numberOfLines={1}
              style={[styles.rowTitle, { color: colors.label }]}>
              {note.title || 'New Note'}
            </Text>
          </View>
          <Text
            numberOfLines={1}
            style={[styles.rowSubtitle, { color: colors.secondary }]}>
            <Text style={{ color: colors.label }}>{formatDate(note.updatedAt)}</Text>
            {note.body ? `  ${note.body.replace(/\n+/g, ' ')}` : '  No additional text'}
          </Text>
        </View>
        <View style={styles.rowActions}>
          <TouchableOpacity
            accessibilityLabel={note.pinned ? 'Unpin' : 'Pin'}
            onPress={onTogglePin}
            hitSlop={10}
            style={styles.rowActionBtn}>
            <Text style={[styles.rowActionGlyph, { color: colors.accent }]}>
              {note.pinned ? '☆' : '★'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityLabel="Delete"
            onPress={onDelete}
            hitSlop={10}
            style={styles.rowActionBtn}>
            <Text style={[styles.rowActionGlyph, { color: colors.danger }]}>
              🗑
            </Text>
          </TouchableOpacity>
          <Text style={[styles.chevron, { color: colors.tertiary }]}>›</Text>
        </View>
      </Pressable>
      {!isLast ? (
        <View
          style={[
            styles.separator,
            { backgroundColor: colors.separator, marginLeft: 16 },
          ]}
        />
      ) : null}
    </View>
  );
}

function EditorModal({
  visible,
  note,
  onClose,
  onSave,
  onDelete,
  colors,
  isDark,
}: {
  visible: boolean;
  note: Note | null;
  onClose: () => void;
  onSave: (draft: { id?: string; title: string; body: string }) => void;
  onDelete?: () => void;
  colors: typeof palette.light;
  isDark: boolean;
}) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  useEffect(() => {
    if (visible) {
      setTitle(note?.title ?? '');
      setBody(note?.body ?? '');
    }
  }, [visible, note]);

  const canSave =
    (title.trim().length > 0 || body.trim().length > 0) &&
    (title !== (note?.title ?? '') || body !== (note?.body ?? ''));

  const handleSave = () => {
    if (!canSave) return;
    onSave({ id: note?.id, title: title.trim(), body });
  };

  return (
    <Modal
      animationType="slide"
      visible={visible}
      onRequestClose={onClose}
      presentationStyle="pageSheet"
      transparent={false}>
      <SafeAreaProvider>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={[styles.flex, { backgroundColor: colors.background }]}>
          <StatusBar
            barStyle={isDark ? 'light-content' : 'dark-content'}
            backgroundColor={colors.background}
          />
          <EditorChrome
            colors={colors}
            title={note ? 'Edit Note' : 'New Note'}
            onCancel={onClose}
            onSave={handleSave}
            canSave={canSave}
          />
          <View style={[styles.editorBody, { backgroundColor: colors.grouped }]}>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Title"
              placeholderTextColor={colors.placeholder}
              style={[styles.editorTitle, { color: colors.label }]}
              autoFocus={!note}
            />
            <View
              style={[styles.separator, { backgroundColor: colors.separator }]}
            />
            <TextInput
              value={body}
              onChangeText={setBody}
              placeholder="Start typing…"
              placeholderTextColor={colors.placeholder}
              multiline
              textAlignVertical="top"
              style={[styles.editorBodyInput, { color: colors.label }]}
            />
          </View>
          {onDelete ? (
            <View style={styles.deleteWrap}>
              <TouchableOpacity
                onPress={() => {
                  onClose();
                  setTimeout(onDelete, 250);
                }}
                style={[
                  styles.deleteBtn,
                  { backgroundColor: colors.grouped },
                ]}>
                <Text style={[styles.deleteText, { color: colors.danger }]}>
                  Delete Note
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </KeyboardAvoidingView>
      </SafeAreaProvider>
    </Modal>
  );
}

function EditorChrome({
  colors,
  title,
  onCancel,
  onSave,
  canSave,
}: {
  colors: typeof palette.light;
  title: string;
  onCancel: () => void;
  onSave: () => void;
  canSave: boolean;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.editorChrome,
        {
          backgroundColor: colors.chrome,
          borderBottomColor: colors.separator,
          paddingTop: insets.top + 8,
        },
      ]}>
      <TouchableOpacity onPress={onCancel} hitSlop={10}>
        <Text style={[styles.chromeBtn, { color: colors.accent }]}>Cancel</Text>
      </TouchableOpacity>
      <Text style={[styles.chromeTitle, { color: colors.label }]}>{title}</Text>
      <TouchableOpacity onPress={onSave} disabled={!canSave} hitSlop={10}>
        <Text
          style={[
            styles.chromeBtn,
            { color: canSave ? colors.accent : colors.tertiary, fontWeight: '600' },
          ]}>
          Save
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  headerWrap: { paddingHorizontal: 16, paddingBottom: 8 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 12,
  },
  largeTitle: {
    fontFamily,
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: 0.37,
  },
  addBtn: { padding: 4 },
  addGlyph: { fontSize: 28, fontWeight: '300', lineHeight: 30 },
  searchField: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 36,
  },
  searchGlyph: { fontSize: 16, marginRight: 6 },
  searchInput: {
    flex: 1,
    fontFamily,
    fontSize: 17,
    paddingVertical: 0,
  },
  clearGlyph: { fontSize: 14, paddingHorizontal: 4 },
  listContent: { paddingHorizontal: 16, paddingTop: 4 },
  sectionHeader: {
    fontFamily,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: 16,
    marginBottom: 6,
    marginLeft: 4,
  },
  rowGroup: {
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    minHeight: 60,
  },
  rowMain: { flex: 1, paddingRight: 8 },
  rowTitleLine: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  pinGlyph: { fontSize: 12, marginRight: 4 },
  rowTitle: {
    fontFamily,
    fontSize: 17,
    fontWeight: '600',
    flexShrink: 1,
  },
  rowSubtitle: { fontFamily, fontSize: 14 },
  rowActions: { flexDirection: 'row', alignItems: 'center' },
  rowActionBtn: { paddingHorizontal: 6 },
  rowActionGlyph: { fontSize: 18 },
  chevron: { fontSize: 22, marginLeft: 4, fontWeight: '300' },
  separator: { height: StyleSheet.hairlineWidth },
  empty: { alignItems: 'center', marginTop: 80 },
  emptyTitle: { fontFamily, fontSize: 22, fontWeight: '600', marginBottom: 6 },
  emptyBody: { fontFamily, fontSize: 15 },
  editorChrome: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  chromeBtn: { fontFamily, fontSize: 17 },
  chromeTitle: { fontFamily, fontSize: 17, fontWeight: '600' },
  editorBody: {
    margin: 16,
    borderRadius: 12,
    padding: 16,
    flex: 1,
  },
  editorTitle: {
    fontFamily,
    fontSize: 22,
    fontWeight: '700',
    paddingVertical: 8,
  },
  editorBodyInput: {
    fontFamily,
    fontSize: 17,
    flex: 1,
    paddingTop: 12,
  },
  deleteWrap: { paddingHorizontal: 16, paddingBottom: 16 },
  deleteBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  deleteText: { fontFamily, fontSize: 17, fontWeight: '500' },
});

export default App;
