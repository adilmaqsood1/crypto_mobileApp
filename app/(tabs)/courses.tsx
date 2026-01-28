import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../lib/theme';
import { Header } from '../components/Header';
import { Card } from '../components/ui/Card';
import { StatusBadge } from '../components/ui/Badge';
import { SkeletonCard } from '../components/ui/Skeleton';
import api, { Course } from '../services/api';

export default function CoursesScreen() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await api.getCourses();
      if (response.data) {
        setCourses(response.data);
      }
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const filteredCourses = selectedLevel
    ? courses.filter(course => course.level === selectedLevel)
    : courses;

  const getLevelColor = (level: string): 'success' | 'warning' | 'danger' => {
    switch (level) {
      case 'Beginner':
        return 'success';
      case 'Intermediate':
        return 'warning';
      case 'Advanced':
        return 'danger';
      default:
        return 'success';
    }
  };

  const renderCourse = ({ item }: { item: Course }) => (
    <Card
      style={styles.courseCard}
      onPress={() => router.push(`/course/${item.id}`)}
      padding="none"
    >
      <Image
        source={{ uri: item.thumbnail }}
        style={styles.thumbnail}
        resizeMode="cover"
      />
      <View style={styles.courseContent}>
        <View style={styles.courseHeader}>
          <StatusBadge label={item.level} variant={getLevelColor(item.level)} />
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={14} color={colors.warning} />
            <Text style={styles.rating}>{item.rating.toFixed(1)}</Text>
          </View>
        </View>

        <Text style={styles.courseTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.courseDescription} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.courseFooter}>
          <View style={styles.courseStats}>
            <View style={styles.statItem}>
              <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.statText}>{item.duration}</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="book-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.statText}>{item.lessons} lessons</Text>
            </View>
          </View>
          <View style={styles.enrolledContainer}>
            <Ionicons name="people-outline" size={14} color={colors.textMuted} />
            <Text style={styles.enrolledText}>
              {item.enrolled.toLocaleString()} enrolled
            </Text>
          </View>
        </View>

        <View style={styles.instructorRow}>
          <View style={styles.instructorAvatar}>
            <Text style={styles.instructorInitial}>
              {item.instructor.charAt(0)}
            </Text>
          </View>
          <Text style={styles.instructorName}>{item.instructor}</Text>
        </View>
      </View>
    </Card>
  );

  const ListHeader = () => (
    <View style={styles.headerSection}>
      <Text style={styles.pageTitle}>Learn Crypto Trading</Text>
      <Text style={styles.pageSubtitle}>
        Master the markets with expert-led courses
      </Text>

      {/* Level Filter */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterChip, !selectedLevel && styles.filterChipActive]}
          onPress={() => setSelectedLevel(null)}
        >
          <Text style={[styles.filterChipText, !selectedLevel && styles.filterChipTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        {['Beginner', 'Intermediate', 'Advanced'].map(level => (
          <TouchableOpacity
            key={level}
            style={[styles.filterChip, selectedLevel === level && styles.filterChipActive]}
            onPress={() => setSelectedLevel(level)}
          >
            <Text style={[
              styles.filterChipText,
              selectedLevel === level && styles.filterChipTextActive
            ]}>
              {level}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const ListEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="school-outline" size={64} color={colors.textMuted} />
      <Text style={styles.emptyTitle}>No Courses Found</Text>
      <Text style={styles.emptyText}>
        Check back later for new courses
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Courses" />

      {isLoading ? (
        <View style={styles.loadingContainer}>
          {[1, 2, 3].map(i => (
            <SkeletonCard key={i} />
          ))}
        </View>
      ) : (
        <FlatList
          data={filteredCourses}
          renderItem={renderCourse}
          keyExtractor={item => item.id}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={ListEmpty}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.appBackground,
  },
  loadingContainer: {
    flex: 1,
    padding: spacing.md,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  headerSection: {
    marginBottom: spacing.lg,
  },
  pageTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  pageSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  filterChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: colors.background,
    fontWeight: '600',
  },
  courseCard: {
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: 160,
    backgroundColor: colors.cardBackgroundLight,
  },
  courseContent: {
    padding: spacing.md,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  courseTitle: {
    ...typography.h4,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  courseDescription: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  courseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  courseStats: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  enrolledContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  enrolledText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  instructorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  instructorAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructorInitial: {
    ...typography.caption,
    color: colors.background,
    fontWeight: '700',
  },
  instructorName: {
    ...typography.bodySmall,
    color: colors.textPrimary,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
