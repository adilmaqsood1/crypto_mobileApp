import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../lib/theme';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import api, { CourseDetail } from '../services/api';

export default function CourseDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);

  useEffect(() => {
    loadCourse();
  }, [id]);

  const loadCourse = async () => {
    if (!id) return;
    try {
      const response = await api.getCourseById(id);
      if (response.data) {
        setCourse(response.data);
      }
    } catch (error) {
      console.error('Error loading course:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnroll = () => {
    setIsEnrolled(true);
  };

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

  // Mock syllabus data
  const syllabus = [
    { title: 'Introduction to the Course', duration: '10 min' },
    { title: 'Understanding Market Basics', duration: '25 min' },
    { title: 'Technical Analysis Fundamentals', duration: '35 min' },
    { title: 'Reading Charts and Patterns', duration: '40 min' },
    { title: 'Risk Management Strategies', duration: '30 min' },
    { title: 'Building Your Trading Plan', duration: '45 min' },
    { title: 'Practice Exercises', duration: '60 min' },
    { title: 'Final Assessment', duration: '20 min' },
  ];

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <Skeleton width="100%" height={200} />
          <Skeleton width="80%" height={24} style={{ marginTop: 16 }} />
          <Skeleton width="60%" height={16} style={{ marginTop: 8 }} />
          <Skeleton width="100%" height={100} style={{ marginTop: 16 }} />
        </View>
      </SafeAreaView>
    );
  }

  if (!course) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.textMuted} />
          <Text style={styles.errorTitle}>Course Not Found</Text>
          <Text style={styles.errorText}>The course you're looking for doesn't exist.</Text>
          <Button title="Go Back" onPress={() => router.back()} style={{ marginTop: 16 }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.shareButton}>
          <Ionicons name="share-outline" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Course Image */}
        <Image
          source={{ uri: course.thumbnail }}
          style={styles.thumbnail}
          resizeMode="cover"
        />

        {/* Course Info */}
        <View style={styles.infoSection}>
          <View style={styles.badgeRow}>
            <StatusBadge label={course.level} variant={getLevelColor(course.level)} />
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={16} color={colors.warning} />
              <Text style={styles.rating}>{course.rating.toFixed(1)}</Text>
              <Text style={styles.ratingCount}>({course.enrolled.toLocaleString()} students)</Text>
            </View>
          </View>

          <Text style={styles.title}>{course.title}</Text>
          <Text style={styles.description}>{course.description}</Text>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Ionicons name="time-outline" size={20} color={colors.primary} />
              <Text style={styles.statValue}>{course.duration}</Text>
              <Text style={styles.statLabel}>Duration</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="book-outline" size={20} color={colors.primary} />
              <Text style={styles.statValue}>{course.lessons}</Text>
              <Text style={styles.statLabel}>Lessons</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="trophy-outline" size={20} color={colors.primary} />
              <Text style={styles.statValue}>Certificate</Text>
              <Text style={styles.statLabel}>Included</Text>
            </View>
          </View>

          {/* Instructor */}
          <Card style={styles.instructorCard}>
            <View style={styles.instructorRow}>
              <View style={styles.instructorAvatar}>
                <Text style={styles.instructorInitial}>
                  {course.instructor.charAt(0)}
                </Text>
              </View>
              <View style={styles.instructorInfo}>
                <Text style={styles.instructorName}>{course.instructor}</Text>
                <Text style={styles.instructorTitle}>Course Instructor</Text>
              </View>
              <TouchableOpacity style={styles.followButton}>
                <Text style={styles.followButtonText}>Follow</Text>
              </TouchableOpacity>
            </View>
          </Card>
        </View>

        {/* Syllabus */}
        <View style={styles.syllabusSection}>
          <Text style={styles.sectionTitle}>Course Content</Text>
          <Card style={styles.syllabusCard} padding="none">
            {syllabus.map((lesson, index) => (
              <View key={index} style={styles.lessonItem}>
                <View style={styles.lessonNumber}>
                  <Text style={styles.lessonNumberText}>{index + 1}</Text>
                </View>
                <View style={styles.lessonContent}>
                  <Text style={styles.lessonTitle}>{lesson.title}</Text>
                  <Text style={styles.lessonDuration}>{lesson.duration}</Text>
                </View>
                <Ionicons
                  name={index === 0 ? 'play-circle' : 'lock-closed'}
                  size={24}
                  color={index === 0 ? colors.primary : colors.textMuted}
                />
              </View>
            ))}
          </Card>
        </View>
      </ScrollView>

      {/* Enroll Button */}
      <View style={styles.enrollContainer}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Price</Text>
          <Text style={styles.price}>Free</Text>
        </View>
        <Button
          title={isEnrolled ? 'Continue Learning' : 'Enroll Now'}
          onPress={handleEnroll}
          style={styles.enrollButton}
          icon={
            <Ionicons
              name={isEnrolled ? 'play' : 'school'}
              size={20}
              color={colors.background}
            />
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.appBackground,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(26, 31, 58, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(26, 31, 58, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    padding: spacing.md,
    marginTop: 60,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  errorTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  errorText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  thumbnail: {
    width: '100%',
    height: 250,
    backgroundColor: colors.cardBackgroundLight,
  },
  infoSection: {
    padding: spacing.md,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  ratingCount: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
  },
  statValue: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  instructorCard: {
    padding: spacing.md,
  },
  instructorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  instructorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  instructorInitial: {
    ...typography.h4,
    color: colors.background,
  },
  instructorInfo: {
    flex: 1,
  },
  instructorName: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  instructorTitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  followButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  followButtonText: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '600',
  },
  syllabusSection: {
    padding: spacing.md,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  syllabusCard: {
    overflow: 'hidden',
  },
  lessonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  lessonNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  lessonNumberText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  lessonContent: {
    flex: 1,
  },
  lessonTitle: {
    ...typography.body,
    color: colors.textPrimary,
  },
  lessonDuration: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  enrollContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.cardBackground,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  priceContainer: {
    marginRight: spacing.md,
  },
  priceLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  price: {
    ...typography.h3,
    color: colors.success,
  },
  enrollButton: {
    flex: 1,
  },
});
