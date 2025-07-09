import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Image,
  Modal,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  RefreshControl,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import Ionicons from 'react-native-vector-icons/Ionicons';

const StudyApp = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const slideAnim = useRef(new Animated.Value(Dimensions.get('window').height)).current;
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [participantCounts, setParticipantCounts] = useState({});
  const [activeScreen, setActiveScreen] = useState('list'); // 'list' or 'chat'
  const [activeChat, setActiveChat] = useState({ chatRoomId: null, studyName: '' });
  // 자동 로그인/자동 userId:1 fetch 관련 코드 제거
  // 앱 시작 시 무조건 로그인 화면이 뜨도록 함
  // SplashScreen 추가 및 이동 버튼 누르면 로그인 화면으로 이동
  // SplashScreen 및 showSplash 관련 코드 완전히 제거

  // 1. 더미 데이터 및 관련 state 삭제
  // const initialStudyData = [...];
  // const [studyList, setStudyList] = useState(initialStudyData);
  // const [filteredStudyData, setFilteredStudyData] = useState(initialStudyData);
  const [studyList, setStudyList] = useState([]);
  const [filteredStudyData, setFilteredStudyData] = useState([]);
  const [categoryList, setCategoryList] = useState([]);

  // 스터디 생성 폼 상태를 useRef로 변경
  // studyFormRef의 category는 id로 저장하도록 변경
  const studyFormRef = useRef({
    name: '',
    category: '', // categoryId로 사용
    peopleCount: '',
    imageUrl: '',
    description: '',
  });

  // 검색 관련 상태를 ref로 변경
  const searchRef = useRef({
    type: 'title',
    text: ''
  });

  const BASE_URL = 'http://192.168.0.41:8080';

  // 2. 목록/카테고리 fetch 함수 추가
  const fetchStudyList = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/study`);
      const data = Array.isArray(res.data) ? res.data : [];
      setStudyList(data);
      setFilteredStudyData(data);
      fetchAllParticipantCounts(data); // 참여자 수 동기화
    } catch (err) {
      setStudyList([]);
      setFilteredStudyData([]);
      setParticipantCounts({});
    }
  };
  const fetchCategoryList = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/study/category`);
      setCategoryList(res.data);
    } catch (err) {
      setCategoryList([]);
    }
  };

  // 스터디방 참여자 수를 모두 fetch
  const fetchAllParticipantCounts = async (studyRooms) => {
    const counts = {};
    await Promise.all(
      studyRooms.map(async (room) => {
        try {
          const res = await axios.get(`${BASE_URL}/api/study/${room.id}/users`);
          counts[room.id] = Array.isArray(res.data) ? res.data.length : 0;
        } catch {
          counts[room.id] = 0;
        }
      })
    );
    setParticipantCounts(counts);
  };

  // 3. 앱 시작 시 목록/카테고리 fetch
  useEffect(() => {
    fetchStudyList();
    fetchCategoryList();
  }, []);

  // 연속 출석 자동 체크: 오늘 날짜와 마지막 출석 날짜가 다르면 출석체크 API 호출
  useEffect(() => {
    // 자동 로그인/자동 userId:1 fetch 관련 코드 제거
    // 앱 시작 시 무조건 로그인 화면이 뜨도록 함
    // SplashScreen 추가 및 이동 버튼 누르면 로그인 화면으로 이동
    // 자동 로그인 관련 useEffect, fetchUserInfo 등도 제거한다.
  }, []);

  useEffect(() => {
    if (showScheduleModal) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: Dimensions.get('window').height,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [showScheduleModal]);

  const closeModal = () => {
    setShowScheduleModal(false);
  };

  const scheduleData = [
    {
      id: 1,
      title: '김영한의 스프링 스터디',
      time: '18:00',
      date: '오늘',
    },
    {
      id: 2,
      title: '모던 자바스크립트 스터디',
      time: '19:30',
      date: '오늘',
    },
    {
      id: 3,
      title: 'React Native 실전 스터디',
      time: '20:00',
      date: '내일',
    },
    {
      id: 4,
      title: '알고리즘 문제풀이 스터디',
      time: '14:00',
      date: '내일',
    }
  ];

  const ScheduleModal = () => (
    <Modal
      transparent={true}
      visible={showScheduleModal}
      onRequestClose={closeModal}
      animationType="none"
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.centerModalContent, styles.scheduleModalContent]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>스터디 일정</Text>
            <TouchableOpacity 
              style={styles.closeButtonContainer}
              onPress={closeModal}
            >
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.scheduleList}>
            {scheduleData.map((schedule) => (
              <View key={schedule.id} style={styles.scheduleItem}>
                <View style={styles.scheduleItemHeader}>
                  <View style={styles.dateBadge}>
                    <Text style={styles.scheduleDate}>{schedule.date}</Text>
                  </View>
                </View>
                <View style={styles.scheduleItemContent}>
                  <View style={styles.scheduleTimeContainer}>
                    <Text style={styles.scheduleTime}>{schedule.time}</Text>
                    <View style={styles.scheduleTimeLine} />
                  </View>
                  <View style={styles.scheduleMainContent}>
                    <View style={styles.scheduleInfo}>
                      <Text style={styles.scheduleItemTitle}>{schedule.title}</Text>
                      <View style={styles.scheduleMetaInfo}>
                        <View style={styles.scheduleStatusBadge}>
                          <Text style={styles.scheduleStatusText}>진행 예정</Text>
                        </View>
                        <Text style={styles.scheduleDuration}>1시간 30분</Text>
                      </View>
                    </View>
  
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  // 출석체크, 방 참여, 방 퇴장 핸들러 제거

  const DashboardScreen = () => {
    const today = new Date();
    const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
    const formattedDate = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;
    const dayOfWeek = days[today.getDay()];

    return (
      <View style={styles.dashboardContainer}>
        <ScrollView style={styles.scrollContainer}>
          <View style={styles.header}>
            <Text style={styles.date}>{formattedDate}</Text>
            <Text style={styles.subtitle}>{dayOfWeek}</Text>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>연속 출석</Text>
              <Text style={styles.statValue}>
                {userInfo ? userInfo.consecutiveAttendance : '-'}일
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>스터디 일정</Text>
              <Text style={styles.statValue}>2개</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>참여중인 방</Text>
              <Text style={styles.statValue}>
                {userInfo ? userInfo.roomCount : '-'}개
              </Text>
            </View>
          </View>
          {/* 출석/방참여/퇴장 버튼 제거됨 */}

          <View style={styles.illustrationContainer}>
            <Image 
              source={getAttendanceImage(userInfo ? userInfo.consecutiveAttendance : 0)} 
              style={styles.illustrationImage} 
            />
          </View>
        </ScrollView>

        <View style={styles.bottomContent}>
          <View style={styles.welcomeCard}>
            <Text style={styles.welcomeTitle}>스터디 일정이 있습니다!</Text>
            <TouchableOpacity onPress={() => setShowScheduleModal(true)}>
              <Text style={styles.welcomeSubtitle}>일정 모아보기</Text>
            </TouchableOpacity>
            <View style={styles.divider} />
            <View style={styles.scheduleRow}>
              <Text style={styles.scheduleText}>김영한의 스프링 스터디</Text>
              <Text style={styles.scheduleText1}>18:00</Text>
            </View>
          </View>
        </View>

        <ScheduleModal />
      </View>
    );
  };

  const handleSearch = () => {
    const { text, type } = searchRef.current;
    
    if (!text.trim()) {
      setFilteredStudyData(studyList);
      setShowSearchModal(false);
      return;
    }

    const searchQuery = text.toLowerCase().trim();
    const filtered = (Array.isArray(studyList) ? studyList : []).filter(study => {
      if (type === 'title') {
        return study?.name && study.name.toLowerCase().includes(searchQuery);
      } else {
        return study?.admin && study.admin.toLowerCase().includes(searchQuery);
      }
    });

    setFilteredStudyData(filtered);
    setShowSearchModal(false);
  };

  // 4. 스터디 생성 핸들러 수정
  const handleCreateStudy = async () => {
    const formData = studyFormRef.current;
    if (!formData.name.trim()) {
      alert('스터디명을 입력해주세요.');
      return;
    }
    if (!formData.category) {
      alert('카테고리를 선택해주세요.');
      return;
    }
    if (!formData.peopleCount) {
      alert('모집 인원을 입력해주세요.');
      return;
    }
    if (!formData.imageUrl) {
      alert('대표 이미지는 필수입니다.');
      return;
    }
    // category는 이제 id임
    const categoriesId = formData.category;
    // StudyRoomDTO 생성
    const newRoom = {
      name: formData.name,
      studyRoomHostId: 1, // 임시로 1번 유저
      categoriesId: categoriesId,
      peopleCount: parseInt(formData.peopleCount, 10),
      password: formData.password, // 추가
      imageUrl: formData.imageUrl, // 추가
      description: formData.description,
    };
    try {
      await axios.post(`${BASE_URL}/api/study`, newRoom);
      setShowCreateModal(false);
      studyFormRef.current = { name: '', category: '', peopleCount: '', password: '', imageUrl: '', description: '' };
      fetchStudyList(); // 생성 후 목록 새로고침
    } catch (err) {
      alert('스터디룸 생성 실패: ' + (err.response?.data?.message || err.message));
    }
  };

  const SearchModal = () => {
    const [localSearch, setLocalSearch] = useState({ type: 'title', text: '' });

    const handleLocalSearch = () => {
      if (!localSearch.text.trim()) {
        setFilteredStudyData(studyList);
        setShowSearchModal(false);
        return;
      }

      const searchQuery = localSearch.text.toLowerCase().trim();
      const filtered = (Array.isArray(studyList) ? studyList : []).filter(study => {
        if (localSearch.type === 'title') {
          return study?.name && study.name.toLowerCase().includes(searchQuery);
        } else {
          return study?.hostName && study.hostName.toLowerCase().includes(searchQuery); // hostName으로 변경
        }
      });

      setFilteredStudyData(filtered);
      setShowSearchModal(false);
    };

    return (
      <Modal
        transparent={true}
        visible={showSearchModal}
        onRequestClose={() => {
          setShowSearchModal(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.centerModalContent, styles.searchModalContent]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>스터디방 검색</Text>
              <TouchableOpacity 
                style={styles.closeButtonContainer}
                onPress={() => setShowSearchModal(false)}
              >
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <View style={styles.searchTypeContainer}>
                <TouchableOpacity 
                  style={[
                    styles.searchTypeButton, 
                    localSearch.type === 'title' && styles.searchTypeActive
                  ]}
                  onPress={() => setLocalSearch({...localSearch, type: 'title'})}
                >
                  <Text style={[
                    styles.searchTypeText,
                    localSearch.type === 'title' && styles.searchTypeTextActive
                  ]}>방 제목</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[
                    styles.searchTypeButton, 
                    localSearch.type === 'admin' && styles.searchTypeActive
                  ]}
                  onPress={() => setLocalSearch({...localSearch, type: 'admin'})}
                >
                  <Text style={[
                    styles.searchTypeText,
                    localSearch.type === 'admin' && styles.searchTypeTextActive
                  ]}>방장 이름</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.searchInputContainer}>
                <TextInput
                  style={styles.searchInput}
                  placeholder={localSearch.type === 'title' ? "스터디방 제목을 입력하세요" : "방장 이름을 입력하세요"}
                  value={localSearch.text}
                  onChangeText={(text) => setLocalSearch({...localSearch, text})}
                  returnKeyType="search"
                  onSubmitEditing={handleLocalSearch}
                />
                <TouchableOpacity 
                  style={styles.searchButton}
                  onPress={handleLocalSearch}
                >
                  <Text style={styles.searchButtonText}>검색</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // CreateModal에서 카테고리 선택 UI를 categoryList 기반으로, value는 id로, label은 name으로 표시
  const CreateModal = () => {
    const [localForm, setLocalForm] = useState({
      ...studyFormRef.current,
      category: studyFormRef.current.category || (categoryList[0]?.id || ''),
      imageUrl: studyFormRef.current.imageUrl || '',
      description: studyFormRef.current.description || '',
    });
    const [showCategoryPicker, setShowCategoryPicker] = useState(false);
    const [imageUri, setImageUri] = useState('');
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
      studyFormRef.current = localForm;
    }, [localForm]);

    const pickImage = async () => {
      // 권한 요청
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('이미지 접근 권한이 필요합니다.');
        return;
      }
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, // 수정됨
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5, // 업로드 용량 최소화
      });
      if (!result.canceled && result.assets && result.assets[0].uri) {
        setImageUri(result.assets[0].uri);
        uploadImage(result.assets[0].uri);
      }
    };

    const uploadImage = async (uri) => {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', {
        uri,
        name: 'studyroom.jpg',
        type: 'image/jpeg',
      });
      try {
        const res = await axios.post(`${BASE_URL}/api/study/upload-image`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setLocalForm((prev) => ({ ...prev, imageUrl: res.data.url }));
        studyFormRef.current.imageUrl = res.data.url;
      } catch (e) {
        alert('이미지 업로드 실패');
      }
      setUploading(false);
    };

    return (
      <Modal
        transparent={true}
        visible={showCreateModal}
        onRequestClose={() => {
          studyFormRef.current = {
            name: '',
            category: categoryList[0]?.id || '',
            peopleCount: '',
            password: '',
            imageUrl: '',
            description: '',
          };
          setShowCreateModal(false);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.centerModalContent, styles.createModalContent]}>
              <View style={styles.createModalHeader}>
                <Text style={styles.createModalTitle}>새로운 스터디 만들기</Text>
                <TouchableOpacity 
                  style={styles.createCloseButton}
                  onPress={() => {
                    studyFormRef.current = {
                      name: '',
                      category: categoryList[0]?.id || '',
                      peopleCount: '',
                      password: '',
                      imageUrl: '',
                      description: '',
                    };
                    setShowCreateModal(false);
                  }}
                >
                  <Text style={styles.createCloseButtonText}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.createFormContainer}>
                <View style={styles.formGroup}>
                  <Text style={styles.createFormLabel}>대표 이미지 (필수)</Text>
                  <TouchableOpacity onPress={pickImage} style={{ ...styles.createFormInput, alignItems: 'center', justifyContent: 'center', height: 120 }}>
                    {localForm.imageUrl ? (
                      <Image source={{ uri: localForm.imageUrl }} style={{ width: 100, height: 100, borderRadius: 10 }} />
                    ) : (
                      <Text style={{ color: '#888' }}>이미지 선택</Text>
                    )}
                  </TouchableOpacity>
                  {uploading && <Text style={{ color: '#4CAF50', marginTop: 4 }}>업로드 중...</Text>}
                </View>
                <View style={styles.formGroup}>
                  <Text style={styles.createFormLabel}>스터디명</Text>
                  <TextInput
                    style={styles.createFormInput}
                    placeholder="스터디 이름을 입력하세요"
                    value={localForm.name}
                    onChangeText={(text) => setLocalForm({...localForm, name: text})}
                    placeholderTextColor="#999"
                  />
                </View>
                <View style={styles.formGroup}>
                  <Text style={styles.createFormLabel}>방 소개</Text>
                  <TextInput
                    style={[styles.createFormInput, styles.createTextArea]}
                    placeholder="방 소개를 입력하세요"
                    value={localForm.description}
                    onChangeText={(text) => setLocalForm({...localForm, description: text})}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                    placeholderTextColor="#999"
                  />
                </View>

                <View style={styles.createFormRow}>
                  <View style={[styles.formGroup, styles.formGroupHalf]}>
                    <Text style={styles.createFormLabel}>카테고리</Text>
                    <TouchableOpacity
                      style={styles.categorySelector}
                      onPress={() => setShowCategoryPicker(true)}
                    >
                      <Text style={styles.categoryText}>
                        {categoryList.find(cat => cat.id === localForm.category)?.name || '카테고리 선택'}
                      </Text>
                      <Text style={styles.categoryArrow}>▼</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={[styles.formGroup, styles.formGroupHalf]}>
                    <Text style={styles.createFormLabel}>모집 인원</Text>
                    <View style={styles.createPeopleCountWrapper}>
                      <TextInput
                        style={styles.createPeopleCountInput}
                        placeholder="0"
                        value={localForm.peopleCount}
                        onChangeText={(text) => {
                          const numericValue = text.replace(/[^0-9]/g, '');
                          setLocalForm({...localForm, peopleCount: numericValue});
                        }}
                        keyboardType="numeric"
                        placeholderTextColor="#999"
                      />
                      <Text style={styles.createPeopleCountLabel}>명</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.createFormLabel}>비밀번호 (선택)</Text>
                  <TextInput
                    style={styles.createFormInput}
                    placeholder="비밀번호를 입력하세요"
                    value={localForm.password}
                    onChangeText={(text) => setLocalForm({ ...localForm, password: text })}
                    secureTextEntry
                    placeholderTextColor="#999"
                  />
                </View>
              </ScrollView>

              <View style={styles.createModalFooter}>
                <TouchableOpacity 
                  style={[styles.createSubmitButton, (!localForm.imageUrl || uploading) && { backgroundColor: '#ccc' }]}
                  onPress={async () => {
                    if (!localForm.imageUrl) {
                      alert('대표 이미지는 필수입니다.');
                      return;
                    }
                    await handleCreateStudy();
                  }}
                  disabled={!localForm.imageUrl || uploading}
                >
                  <Text style={styles.createSubmitButtonText}>스터디 생성하기</Text>
                </TouchableOpacity>
              </View>

              {/* 카테고리 선택 모달 */}
              <Modal
                transparent={true}
                visible={showCategoryPicker}
                animationType="slide"
                onRequestClose={() => setShowCategoryPicker(false)}
              >
                <TouchableOpacity
                  style={styles.categoryModalOverlay}
                  activeOpacity={1}
                  onPress={() => setShowCategoryPicker(false)}
                >
                  <View style={styles.categoryModalContent}>
                    <View style={styles.categoryModalHeader}>
                      <Text style={styles.categoryModalTitle}>카테고리 선택</Text>
                      <TouchableOpacity
                        style={styles.categoryCloseButton}
                        onPress={() => setShowCategoryPicker(false)}
                      >
                        <Text style={styles.categoryCloseButtonText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                    <ScrollView style={styles.categoryList}>
                      {categoryList.map((category) => (
                        <TouchableOpacity
                          key={category.id}
                          style={[
                            styles.categoryItem,
                            localForm.category === category.id && styles.categoryItemSelected
                          ]}
                          onPress={() => {
                            setLocalForm({...localForm, category: category.id});
                            setShowCategoryPicker(false);
                          }}
                        >
                          <Text style={[
                            styles.categoryItemText,
                            localForm.category === category.id && styles.categoryItemTextSelected
                          ]}>
                            {category.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </TouchableOpacity>
              </Modal>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    );
  };

  // 채팅방 화면
  const ChatRoomScreen = ({ chatRoomId, studyName, imageUrl, onBack, userInfo }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const scrollViewRef = useRef(null);
    const inputRef = useRef(null);
    const pollingRef = useRef(false);
    // + 버튼 메뉴 상태 추가
    const [showPlusMenu, setShowPlusMenu] = useState(false);
    // ChatRoomScreen 내부에 일정 생성 모달 상태 추가
    const [showMeetingModal, setShowMeetingModal] = useState(false);
    const [meetingForm, setMeetingForm] = useState({
      date: '', // yyyy-MM-dd-HH:mm
      title: '',
      duration: '',
      onlineType: 'online', // 'online' or 'offline'
    });
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [dateValue, setDateValue] = useState(new Date());
    const [tempDate, setTempDate] = useState(null); // 날짜 선택 임시 저장
    // 일정 생성 함수 추가
    const handleCreateMeeting = async () => {
      if (!meetingForm.date || !meetingForm.title || !meetingForm.duration) {
        alert('모든 항목을 입력해주세요.');
        return;
      }
      try {
        await axios.post(`${BASE_URL}/api/study/meeting`, {
          studyRoomId: chatRoomId,
          title: meetingForm.title,
          duration: meetingForm.duration,
          meetingTime: meetingForm.date, // yyyy-MM-dd-HH:mm
          onlineType: meetingForm.onlineType,
        });
        setShowMeetingModal(false);
        setMeetingForm({ date: '', title: '', duration: '', onlineType: 'online' });
        alert('일정이 생성되었습니다!');
      } catch (err) {
        alert('일정 생성 실패: ' + (err.response?.data?.message || err.message));
      }
    };
    // 일정 정보 불러오기 (채팅방 진입 시)
    const [meeting, setMeeting] = useState(null);
    const [showVoteModal, setShowVoteModal] = useState(false);
    const [voteResult, setVoteResult] = useState(null);
    const [votes, setVotes] = useState({}); // {userId: 'yes'|'no'}

    // 일정 정보 불러오기 (채팅방 진입 시)
    useEffect(() => {
      const fetchMeeting = async () => {
        try {
          const res = await axios.get(`${BASE_URL}/api/study/rooms/${chatRoomId}/meeting`);
          setMeeting(res.data);
        } catch (e) {
          setMeeting(null);
        }
      };
      fetchMeeting();
    }, [chatRoomId]);

    // 메시지 불러오기
    const fetchMessages = async (isPolling = false) => {
      if (isPolling) pollingRef.current = true;
      if (!isPolling) setLoading(true);
      try {
        const res = await axios.get(`${BASE_URL}/api/chat/rooms/${chatRoomId}/all`);
        setMessages(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        setMessages([]);
      }
      if (!isPolling) setLoading(false);
      if (isPolling) pollingRef.current = false;
    };

    // 채팅방 진입 시 최초 1회만 메시지 불러오기
    useEffect(() => {
      fetchMessages();
      const interval = setInterval(() => fetchMessages(true), 2000); // 2초마다 polling
      return () => clearInterval(interval);
    }, [chatRoomId]);

    // 메시지 전송
    const handleSend = async () => {
      if (!input.trim() || !userInfo) return;
      if (!chatRoomId) {
        alert('채팅방 ID가 없습니다. 방 목록에서 다시 입장해 주세요.');
        return;
      }
      setSending(true);
      // 1. 로컬에 바로 추가 (optimistic update)
      const newMsg = {
        id: Date.now(), // 임시 ID
        userId: userInfo.id,
        sender: userInfo.name,
        content: input.trim(),
        sentAt: new Date().toISOString(),
      };
      setMessages(prev => [...prev, newMsg]);
      setInput('');
      try {
        await axios.post(`${BASE_URL}/api/chat/send`, {
          chatRoomId: chatRoomId,
          userId: userInfo.id,
          sender: userInfo.name,
          content: newMsg.content,
        });
        // 2. 서버에서 실제 메시지 목록 다시 fetch
        await fetchMessages();
      } catch (err) {
        // 에러 처리 (필요시 로컬 메시지 롤백)
      }
      setSending(false);
    };

    // 메시지 변경 시 자동 스크롤 제거
    useEffect(() => {
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollToEnd({ animated: true });
      }
    }, [messages]);

    // messages를 한 번만 정렬 (useMemo 사용)
    const sortedMessages = React.useMemo(() => {
      return (Array.isArray(messages) ? messages : []).slice().sort((a, b) => new Date(a.sentAt) - new Date(b.sentAt));
    }, [messages]);

    // 채팅방 상단에 일정 공지 표시 (ScrollView 위로 이동, 항상 상단 고정)
    return (
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: '#fff' }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={60} // 헤더 높이에 맞게 필요시 조정
      >
        <View style={{ flex: 1 }}>
          {/* 상단 헤더 */}
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee' }}>
            <TouchableOpacity
              onPress={onBack}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 24,
                marginRight: 8,
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="arrow-back" size={28} color="#222" />
            </TouchableOpacity>
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} style={{ width: 36, height: 36, borderRadius: 18, marginRight: 10, backgroundColor: '#eee' }} />
            ) : (
              <View style={{ width: 36, height: 36, borderRadius: 18, marginRight: 10, backgroundColor: '#eee', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 20, color: '#bbb' }}>📷</Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{studyName}</Text>
            </View>
            <TouchableOpacity
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 24,
                marginLeft: 8,
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              onPress={openMenuDrawer}
            >
              <Text style={{ fontSize: 28, color: '#222' }}>☰</Text>
            </TouchableOpacity>
          </View>
          {/* 채팅 메시지 목록 */}
          <ScrollView
            style={{ flex: 1, paddingHorizontal: 12 }}
            ref={scrollViewRef}
            maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
          >
            {sortedMessages.map((msg, idx) => {
              const isMe = userInfo && String(msg.userId) === String(userInfo.id);
              // 날짜 구분선 표시 로직
              let showDate = false;
              const currentDate = msg.sentAt ? new Date(msg.sentAt) : null;
              const prevMsg = idx > 0 ? sortedMessages[idx - 1] : null;
              const prevDate = prevMsg && prevMsg.sentAt ? new Date(prevMsg.sentAt) : null;
              if (
                currentDate &&
                (!prevDate ||
                  currentDate.getFullYear() !== prevDate.getFullYear() ||
                  currentDate.getMonth() !== prevDate.getMonth() ||
                  currentDate.getDate() !== prevDate.getDate())
              ) {
                showDate = true;
              }
              // 시간 포맷 함수
              const formatTime = (date) => {
                if (!date) return '';
                const d = typeof date === 'string' ? new Date(date) : date;
                let h = d.getHours();
                const m = d.getMinutes();
                const isAM = h < 12;
                const ampm = isAM ? '오전' : '오후';
                h = h % 12;
                if (h === 0) h = 12;
                return `${ampm} ${h}:${m.toString().padStart(2, '0')}`;
              };
              // userId별 고정 색상 함수
              const avatarColors = ['#6EC6FF', '#FFD54F', '#A5D6A7', '#FF8A65', '#BA68C8', '#4DD0E1', '#F06292', '#90A4AE', '#FFF176', '#81C784'];
              function getAvatarColor(userId) {
                let hash = 0;
                const str = String(userId);
                for (let i = 0; i < str.length; i++) {
                  hash = str.charCodeAt(i) + ((hash << 5) - hash);
                }
                return avatarColors[Math.abs(hash) % avatarColors.length];
              }
              // 1분 그룹 마지막(아래쪽) 메시지에만 시간 표시
              let showTime = true;
              if (idx < sortedMessages.length - 1) {
                const nextMsg = sortedMessages[idx + 1];
                if (
                  nextMsg &&
                  String(nextMsg.userId) === String(msg.userId) &&
                  Math.abs(new Date(nextMsg.sentAt) - new Date(msg.sentAt)) < 60000 // 1분 이내
                ) {
                  showTime = false;
                }
              }
              return (
                <React.Fragment key={msg.id || msg._id || (msg.sentAt + '_' + (msg.userId || '') + '_' + idx)}>
                  {showDate && (
                    <View style={{ alignItems: 'center', marginVertical: 10 }}>
                      <Text style={{ color: '#bbb', fontSize: 13 }}>
                        {`${currentDate.getFullYear()}년 ${currentDate.getMonth() + 1}월 ${currentDate.getDate()}일`}
                      </Text>
                    </View>
                  )}
                  <View
                    key={idx}
                    style={{
                      flexDirection: 'row',
                      justifyContent: isMe ? 'flex-end' : 'flex-start',
                      marginBottom: 8,
                      alignItems: 'center',
                    }}
                  >
                    {/* 수신자(상대방)만 아이콘+이름 */}
                    {!isMe && (() => {
                      const isFirstOfGroup =
                        idx === 0 ||
                        String(sortedMessages[idx - 1].userId) !== String(msg.userId) ||
                        Math.abs(new Date(msg.sentAt) - new Date(sortedMessages[idx - 1].sentAt)) > 60000;
                      return (
                        <>
                          {isFirstOfGroup ? (
                            <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: getAvatarColor(msg.userId), alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
                              <Ionicons name="person" size={20} color="#fff" />
                            </View>
                          ) : (
                            <View style={{ width: 32, height: 32, marginRight: 8 }} />
                          )}
                          <View style={{ flexDirection: 'column', alignItems: 'flex-start', maxWidth: '75%' }}>
                            {isFirstOfGroup && msg.sender && (
                              <Text style={{ fontSize: 12, color: '#444', fontWeight: '500', marginLeft: 6, marginBottom: 2 }}>
                                {msg.sender}
                              </Text>
                            )}
                            <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
                              <View
                                style={{
                                  backgroundColor: '#fff',
                                  borderRadius: 18,
                                  padding: 12,
                                  maxWidth: 220,
                                  borderWidth: 1,
                                  borderColor: '#eee',
                                  shadowColor: '#000',
                                  shadowOffset: { width: 0, height: 1 },
                                  shadowOpacity: 0.05,
                                  shadowRadius: 2,
                                  elevation: 1,
                                  alignSelf: 'flex-start',
                                }}
                              >
                                <Text style={{ color: '#333', fontSize: 15 }}>{msg.content}</Text>
                                {msg.imageUrl ? (
                                  <Image source={{ uri: msg.imageUrl }} style={{ width: 180, height: 120, borderRadius: 10, marginTop: 4 }} />
                                ) : null}
                              </View>
                              {showTime && <Text style={{ fontSize: 11, color: '#888', marginLeft: 4, marginBottom: 2 }}>
                                {msg.sentAt ? formatTime(msg.sentAt) : ''}
                              </Text>}
                            </View>
                          </View>
                        </>
                      );
                    })()}
                    {/* 내 메시지(오른쪽)는 시간-말풍선 순서 */}
                    {isMe && (
                      <>
                        <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
                          {showTime && (
                            <Text style={{ fontSize: 11, color: '#888', marginRight: 4, marginBottom: 2 }}>
                              {msg.sentAt ? formatTime(msg.sentAt) : ''}
                            </Text>
                          )}
                          <View
                            style={{
                              backgroundColor: '#4CAF50',
                              borderRadius: 18,
                              padding: 12,
                              maxWidth: 220,
                              borderWidth: 0,
                              shadowColor: '#000',
                              shadowOffset: { width: 0, height: 1 },
                              shadowOpacity: 0.05,
                              shadowRadius: 2,
                              elevation: 1,
                              alignSelf: 'flex-end',
                            }}
                          >
                            <Text style={{ color: '#fff', fontSize: 15 }}>{msg.content}</Text>
                            {msg.imageUrl ? (
                              <Image source={{ uri: msg.imageUrl }} style={{ width: 180, height: 120, borderRadius: 10, marginTop: 4 }} />
                            ) : null}
                          </View>
                        </View>
                      </>
                    )}
                  </View>
                </React.Fragment>
              );
            })}
          </ScrollView>
          {/* 입력창 */}
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 8 }}>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', borderRadius: 20, paddingHorizontal: 12, height: 48 }}>
              <TouchableOpacity onPress={pickAndSendImage} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#e0e0e0', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                <Ionicons name="camera" size={20} color="#888" />
              </TouchableOpacity>
              <TextInput
                ref={inputRef}
                style={{ flex: 1, fontSize: 17, height: 32, textAlignVertical: 'center', paddingVertical: 0, marginTop: 10 }}
                value={input}
                onChangeText={setInput}
                placeholder="메시지를 입력하세요"
                placeholderTextColor="#bbb"
                onSubmitEditing={handleSend}
                returnKeyType="send"
                blurOnSubmit={false}
                multiline
                maxLength={500}
                autoFocus={!showMenuDrawer}
              />
            </View>
            <TouchableOpacity onPress={handleSend} disabled={sending || !input.trim()} style={{ marginLeft: 8, padding: 8 }}>
              <Text style={{ fontSize: 34, color: sending || !input.trim() ? '#aaa' : '#4A90E2' }}>➤</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    );
  };

  // 로그인 화면
  const LoginScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await axios.post(`${BASE_URL}/api/user/login`, { email, password });
        setUserInfo(res.data);
      } catch (err) {
        setError('로그인 실패: 이메일 또는 비밀번호를 확인하세요');
      }
      setLoading(false);
    };

    return (
      <KeyboardAvoidingView
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        <View style={{ width: '80%', padding: 24, borderRadius: 12, backgroundColor: '#f8f8f8', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
          <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 24, textAlign: 'center' }}>로그인</Text>
          <TextInput
            style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 16, backgroundColor: '#fff' }}
            placeholder="이메일"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 16, backgroundColor: '#fff' }}
            placeholder="비밀번호"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          {error ? <Text style={{ color: 'red', marginBottom: 12 }}>{error}</Text> : null}
          <TouchableOpacity
            style={{ backgroundColor: '#4CAF50', padding: 14, borderRadius: 8, alignItems: 'center', marginBottom: 8 }}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{loading ? '로그인 중...' : '로그인'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  };

  // StudyListScreen 헤더에 로그아웃 버튼 추가
  const StudyListScreen = () => {
    const [showCategoryPicker, setShowCategoryPicker] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('all');
    // StudyListScreen에서 새로고침 상태 관리
    const [refreshing, setRefreshing] = useState(false);
    const onRefresh = async () => {
      setRefreshing(true);
      await fetchStudyList();
      setRefreshing(false);
    };
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={styles.pageTitle}>스터디방 목록</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <TouchableOpacity onPress={() => setShowSearchModal(true)} style={{ padding: 6 }}>
                <Ionicons name="search" size={24} color="#222" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
        <View style={{ height: 18 }} />
        <View style={styles.studyListSection}>
          <CategoryFilterBar
            categoryList={categoryList}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
          <ScrollView
            style={styles.studyListContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={async () => {
                  setRefreshing(true);
                  await fetchStudyList();
                  setFilteredStudyData((data) => data); // 강제 리렌더
                  setRefreshing(false);
                }}
                colors={["#4CAF50"]}
              />
            }
          >
            {(Array.isArray(filteredStudyData) ? filteredStudyData : [])
              .filter(study => selectedCategory === 'all' || study.categoriesId === selectedCategory)
              .map((study) => {
              // created_at에서 년-월-일만 추출
              let createdDate = '';
              if (study?.created_at) {
                const d = new Date(study.created_at);
                createdDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
              }
              const currentCount = (participantCounts && study?.id in participantCounts) ? participantCounts[study.id] : '-';
              // 카테고리명 찾기
              const categoryName = Array.isArray(categoryList)
                ? (categoryList.find(cat => cat.id === study?.categoriesId)?.name || '')
                : '';
              return (
                <TouchableOpacity
                  key={study?.id ?? Math.random()}
                  style={styles.studyListItem}
                  onPress={() => {
                    // 본인이 방장 or 이미 참여중인 방이면 바로 입장
                    const isHost = userInfo && study?.studyRoomHostId === userInfo.id;
                    const isParticipant = Array.isArray(study?.participants)
                      ? study.participants.some(p => p.userId === userInfo?.id)
                      : false;
                    if (isHost || isParticipant) {
                      setActiveScreen('chat');
                      setActiveChat({ chatRoomId: study?.chatId, studyName: study?.name, imageUrl: study?.imageUrl });
                    } else {
                      setJoinModal({ visible: true, study, password: '' });
                    }
                  }}
                >
                  <View style={[styles.studyItemContent, { marginTop: 8 }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      {study?.imageUrl ? (
                        <Image source={{ uri: study.imageUrl }} style={{ width: 48, height: 48, borderRadius: 8, marginRight: 12 }} />
                      ) : (
                        <View style={{ width: 48, height: 48, borderRadius: 8, marginRight: 12, backgroundColor: '#eee', alignItems: 'center', justifyContent: 'center' }}>
                          <Text style={{ color: '#aaa', fontSize: 18 }}>📷</Text>
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        {/* 카테고리 박스 */}
                        <View style={styles.categoryBadge}>
                          <Text style={styles.categoryBadgeText}>{categoryName}</Text>
                        </View>
                        <View style={styles.studyHeader}>
                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <Text style={styles.studyTitle}>
                                {study?.name ?? '-'}
                              </Text>
                              {study?.password ? (
                                <Ionicons name="lock-closed-outline" size={15} color="#888" style={{ marginLeft: 5, marginTop: 1 }} />
                              ) : null}
                            </View>
                            {study?.description ? (
                              <Text style={styles.studyDescription}>{study.description}</Text>
                            ) : null}
                          </View>
                          <View style={{ alignItems: 'flex-end', minWidth: 60 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' }}>
                              <Ionicons name="person-outline" size={15} color={styles.hostNameText.color} style={{ marginRight: 3 }} />
                              <Text style={[styles.studyProgress, { color: styles.hostNameText.color }]}>{currentCount}/{study?.peopleCount ?? '-'}명</Text>
                            </View>
                            <Text style={styles.hostNameText}>방장: {study?.hostName ?? '-'}</Text>
                          </View>
                        </View>
                        <View style={styles.studyInfo}>
                          {/* 방장 이름은 위로 이동 */}
                        </View>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
        <SearchModal />
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setActiveScreen('create')}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={32} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  };

  // MoreScreen 헤더에도 로그아웃 버튼 추가
  const MoreScreen = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>더보기</Text>
      </View>

      <View style={styles.moreSection}>
        <TouchableOpacity style={styles.moreItem}>
          <View style={styles.moreItemContent}>
            <View style={styles.moreIconContainer}>
              <Text style={styles.moreIcon}>🔗</Text>
            </View>
            <View style={styles.moreTextContainer}>
              <Text style={styles.moreItemTitle}>다른 서비스로 이동하기</Text>
              <Text style={styles.moreItemSubtitle}>연결된 다른 서비스를 이용해보세요</Text>
            </View>
          </View>
          <Text style={styles.moreArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.moreItem}>
          <View style={styles.moreItemContent}>
            <View style={styles.moreIconContainer}>
              <Text style={styles.moreIcon}>⚙️</Text>
            </View>
            <View style={styles.moreTextContainer}>
              <Text style={styles.moreItemTitle}>설정</Text>
              <Text style={styles.moreItemSubtitle}>앱 설정을 관리하세요</Text>
            </View>
          </View>
          <Text style={styles.moreArrow}>›</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // renderScreen에서 SplashScreen 분기 제거, 로그인하지 않으면 무조건 LoginScreen만 보이게
  const renderScreen = () => {
    if (!userInfo) {
      return <LoginScreen />;
    }
    if (activeScreen === 'chat') {
      return <ChatRoomScreen chatRoomId={activeChat.chatRoomId} studyName={activeChat.studyName} imageUrl={activeChat.imageUrl} onBack={() => setActiveScreen('list')} userInfo={userInfo} />;
    }
    if (activeScreen === 'create') {
      return <StudyCreateScreen onCreated={() => setActiveScreen('list')} onCancel={() => setActiveScreen('list')} categoryList={categoryList} fetchStudyList={fetchStudyList} userInfo={userInfo} />;
    }
    if (activeScreen === 'chat-list') {
      return <ChatListScreen />;
    }
    switch (activeTab) {
      case 'dashboard':
        return <DashboardScreen />;
      case 'study-list':
        return <StudyListScreen />;
      case 'more':
        return <MoreScreen />;
      default:
        return <DashboardScreen />;
    }
  };

  // 연속 참석일에 따른 이미지 선택 함수
  const getAttendanceImage = (days) => {
    if (days >= 91) return require('../assets/images/fw.png');
    if (days >= 61) return require('../assets/images/four-image.png');
    if (days >= 31) return require('../assets/images/third-image.png');
    if (days >= 11) return require('../assets/images/second-image.png');
    return require('../assets/images/first_image.png');
  };

  // 카테고리 라벨 가져오기 함수
  const getCategoryLabel = (value) => {
    const categories = {
      'programming': '📚 프로그래밍 / 개발',
      'design': '🎨 디자인',
      'language': '🌏 외국어',
      'job': '💼 취업 / 이직',
      'data_science': '📊 데이터 사이언스',
      'mobile_dev': '📱 모바일 앱 개발',
      'game_dev': '🎮 게임 개발',
      'security': '🔒 보안 / 네트워크',
      'devops': '☁️ 클라우드 / DevOps',
      'ai_ml': '🤖 AI / 머신러닝',
      'video_editing': '🎥 영상 편집',
      'music': '🎵 음악 / 작곡',
      'writing': '📝 블로그 / 글쓰기',
      'investment': '📈 주식 / 투자',
      'reading': '📚 독서',
      'certification': '✏️ 자격증',
      'interview': '📋 면접 준비',
      'language_test': '📖 어학시험',
      'coding_test': '🎯 코딩테스트',
      'web_dev': '🌐 웹 개발'
    };
    return categories[value] || "카테고리 선택";
  };

  // handleVote 함수 수정: 서버에 투표 저장, 투표 현황/과반수 여부 확인
  const handleVote = async (vote) => {
    try {
      // 1. 서버에 투표 저장
      await axios.post(`${BASE_URL}/api/study/meeting/vote`, {
        meetingId: meeting.id,
        userId: userInfo.id,
        vote,
      });
      // 2. 투표 현황 조회
      const votesRes = await axios.get(`${BASE_URL}/api/study/meeting/${meeting.id}/votes`);
      setVotes(
        Object.fromEntries(
          votesRes.data.map(v => [v.user.id, v.vote])
        )
      );
      // 3. 과반수 찬성 여부 확인
      const approvedRes = await axios.get(`${BASE_URL}/api/study/meeting/${meeting.id}/approved`, {
        params: { participantCount: participantCounts[chatRoomId] || 1 }
      });
      if (approvedRes.data) {
        setVoteResult('approved');
        // 일정이 모든 참여자 계정에 등록됨
      } else if (Object.keys(votesRes.data).length === (participantCounts[chatRoomId] || 1)) {
        setVoteResult('rejected');
      } else {
        setVoteResult(null);
      }
    } catch (err) {
      alert('투표 처리 중 오류: ' + (err.response?.data?.message || err.message));
    }
  };

  // 이미지 전송 함수
  const pickAndSendImage = async () => {
    alert('pickAndSendImage 실행');
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    alert('권한 요청 결과: ' + status);
    if (status !== 'granted') {
      alert('이미지 접근 권한이 필요합니다.');
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
    });
    alert('이미지 선택 결과: ' + JSON.stringify(result));
    if (!result.canceled && result.assets && result.assets[0].uri) {
      alert('이미지 선택됨: ' + result.assets[0].uri);
      // 이미지 업로드 (FormData)
      const formData = new FormData();
      formData.append('file', {
        uri: result.assets[0].uri,
        name: 'chat_image.jpg',
        type: 'image/jpeg',
      });
      try {
        const res = await axios.post(`${BASE_URL}/api/study/upload-image`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        const imageUrl = res.data.url;
        alert('이미지 업로드 성공: ' + imageUrl);
        // 채팅 메시지 전송 (JSON, headers 없이!)
        await axios.post(`${BASE_URL}/api/chat/send`, {
          chatRoomId: chatRoomId,
          userId: userInfo.id,
          sender: userInfo.name,
          content: '',
          imageUrl,
        });
        alert('이미지 메시지 전송 성공');
        await fetchMessages();
      } catch (e) {
        alert('이미지 전송 실패: ' + (e.response?.data?.message || e.message));
      }
    } else {
      alert('이미지 선택이 취소되었거나 실패했습니다.');
    }
  };

  // 내가 참여한 방만 가져오는 함수
  const fetchMyStudyRooms = async () => {
    if (!userInfo) return;
    try {
      const res = await axios.get(`${BASE_URL}/api/study/${userInfo.id}/rooms`);
      const data = Array.isArray(res.data) ? res.data : [];
      setStudyList(data);
      setFilteredStudyData(data);
      fetchAllParticipantCounts(data);
    } catch (err) {
      setStudyList([]);
      setFilteredStudyData([]);
      setParticipantCounts({});
    }
  };

  // StudyListScreen 진입 시/탭 전환 시 무조건 내가 참여한 방만 보이게
  useEffect(() => {
    if (activeTab === 'study-list') {
      fetchStudyList();
    }
  }, [activeTab]);

  // ChatRoomScreen 내부 state 추가
  const [showMenuDrawer, setShowMenuDrawer] = useState(false);
  const menuAnim = useRef(new Animated.Value(Dimensions.get('window').width)).current;
  const [participants, setParticipants] = useState([]);
  const [participantsLoading, setParticipantsLoading] = useState(false);

  // 메뉴 모달 열기 함수
  const openMenuDrawer = async () => {
    setShowMenuDrawer(true);
    setParticipantsLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/api/study/${chatRoomId}/users`);
      setParticipants(Array.isArray(res.data) ? res.data : []);
    } catch {
      setParticipants([]);
    }
    setParticipantsLoading(false);
    Animated.timing(menuAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  };

  // 메뉴 닫기 함수
  const closeMenuDrawer = () => {
    Keyboard.dismiss(); // 드로어 닫을 때 키보드 내리기
    Animated.timing(menuAnim, {
      toValue: Dimensions.get('window').width,
      duration: 200,
      useNativeDriver: false,
    }).start(() => setShowMenuDrawer(false));
  };

  // 방 퇴장 함수
  const handleLeaveRoom = async () => {
    if (!confirm('정말로 이 방에서 퇴장하시겠습니까?')) return;
    try {
      await axios.post(`${BASE_URL}/api/study/leave`, {
        studyRoomId: chatRoomId,
        userId: userInfo?.id,
      });
      closeMenuDrawer();
      onBack && onBack();
    } catch (err) {
      alert('방 퇴장 실패: ' + (err.response?.data?.message || err.message));
    }
  };

  const [showChatListModal, setShowChatListModal] = useState(false);

  // 참여중인 채팅방 목록 모달
  const ChatListModal = () => (
    <Modal
      transparent={true}
      visible={showChatListModal}
      onRequestClose={() => setShowChatListModal(false)}
      animationType="slide"
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.centerModalContent, { maxHeight: 500, width: '90%' }]}> 
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>참여중인 채팅방</Text>
            <TouchableOpacity 
              style={styles.closeButtonContainer}
              onPress={() => setShowChatListModal(false)}
            >
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={{ maxHeight: 400 }}>
            {(Array.isArray(studyList) ? studyList : []).filter(study => study.chatId).length === 0 ? (
              <View style={{ alignItems: 'center', justifyContent: 'center', marginTop: 60 }}>
                <Text style={{ color: '#888', fontSize: 16, marginBottom: 18 }}>참여중인 채팅방이 없습니다</Text>
              </View>
            ) : (
              (Array.isArray(studyList) ? studyList : [])
                .filter(study => study.chatId)
                .map((study) => (
                  <TouchableOpacity
                    key={study.chatId}
                    style={styles.studyListItem}
                    onPress={() => {
                      setActiveScreen('chat');
                      setActiveChat({ chatRoomId: study.chatId, studyName: study.name, imageUrl: study.imageUrl });
                      setShowChatListModal(false);
                    }}
                  >
                    <View style={styles.studyItemContent}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        {study?.imageUrl ? (
                          <Image source={{ uri: study.imageUrl }} style={{ width: 48, height: 48, borderRadius: 8, marginRight: 12 }} />
                        ) : (
                          <View style={{ width: 48, height: 48, borderRadius: 8, marginRight: 12, backgroundColor: '#eee', alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={{ color: '#aaa', fontSize: 18 }}>📷</Text>
                          </View>
                        )}
                        <View style={{ flex: 1 }}>
                          <View style={styles.studyHeader}>
                            <Text style={styles.studyTitle}>{study.name}</Text>
                          </View>
                          <View style={styles.studyInfo}>
                            <Text style={styles.nextMeeting}>방장: {study?.hostName ?? '-'}</Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  // 카테고리 필터 바 컴포넌트
  const CategoryFilterBar = ({ categoryList, selectedCategory, onSelectCategory }) => (
    <View style={{ backgroundColor: '#fff', paddingVertical: 4 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12, marginBottom: 8 }}>
        <TouchableOpacity
          style={[styles.categoryButton, selectedCategory === 'all' && styles.categoryButtonSelected]}
          onPress={() => onSelectCategory('all')}
        >
          <Text style={[styles.categoryButtonText, selectedCategory === 'all' && styles.categoryButtonTextSelected]}>전체</Text>
        </TouchableOpacity>
        {categoryList.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.categoryButton, selectedCategory === cat.id && styles.categoryButtonSelected]}
            onPress={() => onSelectCategory(cat.id)}
          >
            <Text style={[styles.categoryButtonText, selectedCategory === cat.id && styles.categoryButtonTextSelected]}>{cat.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  // StudyCreateScreen 컴포넌트 추가
  const StudyCreateScreen = ({ onCreated, onCancel, categoryList, fetchStudyList, userInfo }) => {
    const [localForm, setLocalForm] = useState({
      name: '',
      category: categoryList[0]?.id || '',
      peopleCount: '',
      password: '',
      imageUrl: '',
      description: '',
    });
    const [imageUri, setImageUri] = useState('');
    const [uploading, setUploading] = useState(false);
    const pickImage = async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('이미지 접근 권한이 필요합니다.');
        return;
      }
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5,
      });
      if (!result.canceled && result.assets && result.assets[0].uri) {
        setImageUri(result.assets[0].uri);
        uploadImage(result.assets[0].uri);
      }
    };
    const uploadImage = async (uri) => {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', {
        uri,
        name: 'studyroom.jpg',
        type: 'image/jpeg',
      });
      try {
        const res = await axios.post(`${BASE_URL}/api/study/upload-image`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setLocalForm((prev) => ({ ...prev, imageUrl: res.data.url }));
      } catch (e) {
        alert('이미지 업로드 실패');
      }
      setUploading(false);
    };
    const handleCreate = async () => {
      if (!localForm.name.trim()) {
        alert('스터디명을 입력해주세요.');
        return;
      }
      if (!localForm.category) {
        alert('카테고리를 선택해주세요.');
        return;
      }
      if (!localForm.peopleCount) {
        alert('모집 인원을 입력해주세요.');
        return;
      }
      if (!localForm.imageUrl) {
        alert('대표 이미지는 필수입니다.');
        return;
      }
      const newRoom = {
        name: localForm.name,
        studyRoomHostId: userInfo?.id,
        hostName: userInfo?.name,
        categoriesId: localForm.category,
        peopleCount: parseInt(localForm.peopleCount, 10),
        password: localForm.password,
        imageUrl: localForm.imageUrl,
        description: localForm.description,
      };
      try {
        await axios.post(`${BASE_URL}/api/study`, newRoom);
        fetchStudyList && fetchStudyList();
        onCreated && onCreated();
      } catch (err) {
        alert('스터디룸 생성 실패: ' + (err.response?.data?.message || err.message));
      }
    };
    return (
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: '#fff' }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={60}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderColor: '#eee' }}>
            <TouchableOpacity onPress={onCancel} style={{ padding: 6, marginRight: 8 }}>
              <Ionicons name="arrow-back" size={28} color="#222" />
            </TouchableOpacity>
            <Text style={{ fontSize: 18, fontWeight: 'bold' }}>스터디 만들기</Text>
          </View>
          <ScrollView style={{ flex: 1, padding: 20 }}>
            <View style={styles.formGroup}>
              <Text style={styles.createFormLabel}>대표 이미지 (필수)</Text>
              <TouchableOpacity onPress={pickImage} style={{ ...styles.createFormInput, alignItems: 'center', justifyContent: 'center', height: 120 }}>
                {localForm.imageUrl ? (
                  <Image source={{ uri: localForm.imageUrl }} style={{ width: 100, height: 100, borderRadius: 10 }} />
                ) : (
                  <Text style={{ color: '#888' }}>이미지 선택</Text>
                )}
              </TouchableOpacity>
              {uploading && <Text style={{ color: '#4CAF50', marginTop: 4 }}>업로드 중...</Text>}
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.createFormLabel}>스터디명</Text>
              <TextInput
                style={styles.createFormInput}
                placeholder="스터디 이름을 입력하세요"
                value={localForm.name}
                onChangeText={(text) => setLocalForm({...localForm, name: text})}
                placeholderTextColor="#999"
              />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.createFormLabel}>방 소개</Text>
              <TextInput
                style={[styles.createFormInput, styles.createTextArea]}
                placeholder="방 소개를 입력하세요"
                value={localForm.description}
                onChangeText={(text) => setLocalForm({...localForm, description: text})}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                placeholderTextColor="#999"
              />
            </View>
            <View style={styles.createFormRow}>
              <View style={[styles.formGroup, styles.formGroupHalf]}>
                <Text style={styles.createFormLabel}>카테고리</Text>
                <TouchableOpacity
                  style={styles.categorySelector}
                  onPress={() => {}}
                >
                  <Text style={styles.categoryText}>
                    {categoryList.find(cat => cat.id === localForm.category)?.name || '카테고리 선택'}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={[styles.formGroup, styles.formGroupHalf]}>
                <Text style={styles.createFormLabel}>모집 인원</Text>
                <View style={styles.createPeopleCountWrapper}>
                  <TextInput
                    style={styles.createPeopleCountInput}
                    placeholder="0"
                    value={localForm.peopleCount}
                    onChangeText={(text) => {
                      const numericValue = text.replace(/[^0-9]/g, '');
                      setLocalForm({...localForm, peopleCount: numericValue});
                    }}
                    keyboardType="numeric"
                    placeholderTextColor="#999"
                  />
                  <Text style={styles.createPeopleCountLabel}>명</Text>
                </View>
              </View>
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.createFormLabel}>비밀번호 (선택)</Text>
              <TextInput
                style={styles.createFormInput}
                placeholder="비밀번호를 입력하세요"
                value={localForm.password}
                onChangeText={(text) => setLocalForm({ ...localForm, password: text })}
                secureTextEntry
                placeholderTextColor="#999"
              />
            </View>
          </ScrollView>
          <View style={styles.createModalFooter}>
            <TouchableOpacity
              style={[styles.createSubmitButton, (!localForm.imageUrl || uploading) && { backgroundColor: '#ccc' }]}
              onPress={handleCreate}
              disabled={!localForm.imageUrl || uploading}
            >
              <Text style={styles.createSubmitButtonText}>스터디 생성하기</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    );
  };

  // 참여 모달 상태
  const [joinModal, setJoinModal] = useState({ visible: false, study: null, password: '' });
  const [joinLoading, setJoinLoading] = useState(false);
  const handleJoinRoom = async () => {
    if (!joinModal.study) return;
    setJoinLoading(true);
    try {
      // 비밀번호가 있으면 체크
      if (joinModal.study.password) {
        if (!joinModal.password) {
          alert('비밀번호를 입력하세요.');
          setJoinLoading(false);
          return;
        }
        if (joinModal.password !== joinModal.study.password) {
          alert('비밀번호가 일치하지 않습니다.');
          setJoinLoading(false);
          return;
        }
      }
      // 참여 API 호출 (이미 참여자면 중복 방지)
      await axios.post(`${BASE_URL}/api/study/rooms/join`, {
        studyRoomId: joinModal.study.id,
        userId: userInfo.id,
      });
      setJoinModal({ visible: false, study: null, password: '' });
      setActiveScreen('chat');
      setActiveChat({ chatRoomId: joinModal.study.chatId, studyName: joinModal.study.name, imageUrl: joinModal.study.imageUrl });
      fetchStudyList();
    } catch (err) {
      alert('참여 실패: ' + (err.response?.data?.message || err.message));
    }
    setJoinLoading(false);
  };

  // 참여중인 채팅방 목록 화면
  const ChatListScreen = () => {
    const [chatRooms, setChatRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
      const fetchChatRooms = async () => {
        setLoading(true);
        try {
          // 참여중인 스터디방 목록에서 채팅방 정보와 마지막 메시지 가져오기
          const res = await axios.get(`${BASE_URL}/api/study/${userInfo.id}/rooms`);
          const rooms = Array.isArray(res.data) ? res.data : [];
          // 각 채팅방의 마지막 메시지 fetch
          const roomsWithLastMsg = await Promise.all(
            rooms.filter(r => r.chatId).map(async (room) => {
              let lastMsg = null;
              try {
                const msgRes = await axios.get(`${BASE_URL}/api/chat/rooms/${room.chatId}/all`);
                const msgs = Array.isArray(msgRes.data) ? msgRes.data : [];
                lastMsg = msgs.length > 0 ? msgs[msgs.length - 1] : null;
              } catch {}
              return { ...room, lastMsg };
            })
          );
          // 최신 메시지 순 정렬
          roomsWithLastMsg.sort((a, b) => {
            const aTime = a.lastMsg?.sentAt ? new Date(a.lastMsg.sentAt).getTime() : 0;
            const bTime = b.lastMsg?.sentAt ? new Date(b.lastMsg.sentAt).getTime() : 0;
            return bTime - aTime;
          });
          setChatRooms(roomsWithLastMsg);
        } finally {
          setLoading(false);
        }
      };
      fetchChatRooms();
    }, [userInfo]);
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderColor: '#eee' }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold' }}>참여중인 채팅방</Text>
        </View>
        {loading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Text>로딩 중...</Text></View>
        ) : (
          <ScrollView style={{ flex: 1 }}>
            {chatRooms.length === 0 ? (
              <View style={{ alignItems: 'center', marginTop: 60 }}>
                <Text style={{ color: '#888', fontSize: 16 }}>참여중인 채팅방이 없습니다</Text>
              </View>
            ) : (
              chatRooms.map(room => (
                <TouchableOpacity
                  key={room.chatId}
                  style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderColor: '#f0f0f0' }}
                  onPress={() => {
                    setActiveScreen('chat');
                    setActiveChat({ chatRoomId: room.chatId, studyName: room.name, imageUrl: room.imageUrl });
                  }}
                >
                  {room.imageUrl ? (
                    <Image source={{ uri: room.imageUrl }} style={{ width: 48, height: 48, borderRadius: 10, marginRight: 14 }} />
                  ) : (
                    <View style={{ width: 48, height: 48, borderRadius: 10, marginRight: 14, backgroundColor: '#eee', alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: '#aaa', fontSize: 18 }}>📷</Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#222' }} numberOfLines={1}>{room.name}</Text>
                    <Text style={{ fontSize: 13, color: '#666', marginTop: 2 }} numberOfLines={1} ellipsizeMode="tail">
                      {room.lastMsg?.content ? room.lastMsg.content : '메시지가 없습니다'}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', marginLeft: 10 }}>
                    <Text style={{ fontSize: 11, color: '#aaa' }}>
                      {room.lastMsg?.sentAt ? new Date(room.lastMsg.sentAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) : ''}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      <View style={styles.content}>
        {renderScreen()}
      </View>
      {/* 채팅방이 아닐 때만 탭바 표시 */}
      {userInfo && activeScreen !== 'chat' && (
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'dashboard' && styles.activeTabButton]}
            onPress={() => { setActiveTab('dashboard'); setActiveScreen('dashboard'); }}
          >
            <Text style={styles.tabIcon}>≡</Text>
            <Text style={[styles.tabButtonText, activeTab === 'dashboard' && styles.activeTabButtonText]}>대시보드</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, { flex: 1 }, activeTab === 'study-list' && styles.activeTabButton]}
            onPress={() => { setActiveTab('study-list'); setActiveScreen('list'); }}
          >
            <Ionicons name="book-outline" size={22} color="#222" style={[styles.tabIcon, { marginTop: 4 }]} />
            <Text style={[styles.tabButtonText, activeTab === 'study-list' && styles.activeTabButtonText]}>스터디룸</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, { flex: 1 }, activeTab === 'chat-list' && styles.activeTabButton]}
            onPress={() => { setActiveTab('chat-list'); setActiveScreen('chat-list'); }}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={22} color={activeTab === 'chat-list' ? '#4CAF50' : '#222'} style={[styles.tabIcon, { marginTop: 4 }]} />
            <Text style={[styles.tabButtonText, activeTab === 'chat-list' && styles.activeTabButtonText]}>채팅</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, { flex: 1 }, activeTab === 'more' && styles.activeTabButton]}
            onPress={() => { setActiveTab('more'); setActiveScreen('more'); }}
          >
            <Text style={[styles.tabIcon, { marginTop: 4 }]}>⋯</Text>
            <Text style={[styles.tabButtonText, activeTab === 'more' && styles.activeTabButtonText]}>더보기</Text>
          </TouchableOpacity>
        </View>
      )}
      <SearchModal />
      <Modal
        transparent={true}
        visible={showPicker}
        onRequestClose={() => setShowPicker(false)}
      >
        <TouchableOpacity 
          style={styles.pickerModalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowPicker(false)}
        >
          <View style={styles.pickerContainer}>
            <View style={styles.pickerHeader}>
              <TouchableOpacity onPress={() => setShowPicker(false)}>
                <Text style={styles.pickerDoneButton}>완료</Text>
              </TouchableOpacity>
            </View>
            <Picker
              selectedValue={studyFormRef.current.category}
              onValueChange={(value) => {
                const newForm = {...studyFormRef.current, category: value};
                studyFormRef.current = newForm;
                setShowPicker(false);
              }}
              style={styles.picker}
            >
              <Picker.Item label="카테고리 선택" value="" />
              <Picker.Item label="📚 프로그래밍 / 개발" value="programming" />
              <Picker.Item label="🎨 디자인" value="design" />
              <Picker.Item label="🌏 외국어" value="language" />
              <Picker.Item label="💼 취업 / 이직" value="job" />
              <Picker.Item label="📊 데이터 사이언스" value="data_science" />
              <Picker.Item label="📱 모바일 앱 개발" value="mobile_dev" />
              <Picker.Item label="🎮 게임 개발" value="game_dev" />
              <Picker.Item label="🔒 보안 / 네트워크" value="security" />
              <Picker.Item label="☁️ 클라우드 / DevOps" value="devops" />
              <Picker.Item label="🤖 AI / 머신러닝" value="ai_ml" />
              <Picker.Item label="🎥 영상 편집" value="video_editing" />
              <Picker.Item label="🎵 음악 / 작곡" value="music" />
              <Picker.Item label="📝 블로그 / 글쓰기" value="writing" />
              <Picker.Item label="📈 주식 / 투자" value="investment" />
              <Picker.Item label="📚 독서" value="reading" />
              <Picker.Item label="✏️ 자격증" value="certification" />
              <Picker.Item label="📋 면접 준비" value="interview" />
              <Picker.Item label="📖 어학시험" value="language_test" />
              <Picker.Item label="🎯 코딩테스트" value="coding_test" />
              <Picker.Item label="🌐 웹 개발" value="web_dev" />
            </Picker>
          </View>
        </TouchableOpacity>
      </Modal>
      {showMenuDrawer && (
        <>
          <TouchableOpacity
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.3)', zIndex: 10 }}
            activeOpacity={1}
            onPress={closeMenuDrawer}
          />
          <Animated.View
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: Dimensions.get('window').width * 0.75,
              height: '100%',
              backgroundColor: '#fff',
              zIndex: 20,
              padding: 24,
              shadowColor: '#000',
              shadowOffset: { width: -2, height: 0 },
              shadowOpacity: 0.15,
              shadowRadius: 8,
              elevation: 8,
              transform: [{ translateX: menuAnim }],
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold' }}>채팅방 정보</Text>
              <TouchableOpacity onPress={closeMenuDrawer}>
                <Ionicons name="close" size={28} color="#888" />
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: 15, fontWeight: '500', marginBottom: 10 }}>참여자</Text>
            <ScrollView style={{ maxHeight: 220 }}>
              {participantsLoading ? (
                <Text style={{ color: '#888', textAlign: 'center', marginTop: 20 }}>로딩 중...</Text>
              ) : (
                participants.map((user) => (
                  <View key={user.id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                    <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#eee', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                      <Text style={{ fontSize: 18, color: '#888' }}>👤</Text>
                    </View>
                    <Text style={{ fontSize: 16, color: '#222', fontWeight: '500' }}>{user.name}</Text>
                  </View>
                ))
              )}
            </ScrollView>
            <TouchableOpacity
              style={{
                marginTop: 32,
                backgroundColor: '#FF5252',
                borderRadius: 12,
                paddingVertical: 14,
                alignItems: 'center',
              }}
              onPress={handleLeaveRoom}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>방 퇴장</Text>
            </TouchableOpacity>
          </Animated.View>
        </>
      )}
      <ChatListModal />
      <Modal
        transparent
        visible={joinModal.visible}
        animationType="fade"
        onRequestClose={() => setJoinModal({ visible: false, study: null, password: '' })}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.centerModalContent, { width: '85%', maxWidth: 350, padding: 24 }]}> 
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' }}>방에 참여하시겠습니까?</Text>
            {/* 썸네일 */}
            {joinModal.study?.imageUrl ? (
              <Image source={{ uri: joinModal.study.imageUrl }} style={{ width: 60, height: 60, borderRadius: 12, alignSelf: 'center', marginBottom: 12 }} />
            ) : null}
            {/* 제목 */}
            <Text style={{ fontSize: 17, fontWeight: 'bold', color: '#222', textAlign: 'center', marginBottom: 6 }} numberOfLines={1} ellipsizeMode="tail">
              {joinModal.study?.name ?? ''}
            </Text>
            {/* 소개 */}
            {joinModal.study?.description ? (
              <Text style={{ fontSize: 14, color: '#666', marginBottom: 10, textAlign: 'center' }} numberOfLines={2} ellipsizeMode="tail">
                {joinModal.study.description}
              </Text>
            ) : null}
            {/* 인원수, 방장명 */}
            <Text style={{ fontSize: 13, color: '#888', textAlign: 'center', marginBottom: 14 }}>
              인원수: {participantCounts[joinModal.study?.id] ?? '-'} / {joinModal.study?.peopleCount ?? '-'}명  |  방장: {joinModal.study?.hostName ?? '-'}
            </Text>
            {joinModal.study?.password ? (
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 14, color: '#666', marginBottom: 6 }}>비밀번호</Text>
                <TextInput
                  style={[styles.createFormInput, { marginBottom: 0 }]}
                  placeholder="비밀번호를 입력하세요"
                  value={joinModal.password}
                  onChangeText={pw => setJoinModal(j => ({ ...j, password: pw }))}
                  secureTextEntry
                  placeholderTextColor="#999"
                />
              </View>
            ) : null}
            <View style={{ flexDirection: 'row', marginTop: 32 }}>
              <TouchableOpacity
                style={[styles.createSubmitButton, { backgroundColor: '#ccc', flex: 1, marginHorizontal: 4 }]}
                onPress={() => setJoinModal({ visible: false, study: null, password: '' })}
                disabled={joinLoading}
              >
                <Text style={styles.createSubmitButtonText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.createSubmitButton, joinLoading && { backgroundColor: '#ccc' }, { flex: 1, marginHorizontal: 4 }]}
                onPress={handleJoinRoom}
                disabled={joinLoading}
              >
                <Text style={styles.createSubmitButtonText}>{joinLoading ? '참여 중...' : '참여'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  app: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    marginLeft: 10,
    marginBottom: 5,
  },
  date: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    marginTop: 25,
    marginHorizontal: 15,
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    marginLeft: 10,
    marginRight: 10,
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
     illustrationContainer: {
     alignItems: 'center',
     marginBottom: 2,
     height: 300,
    backgroundColor: '#ECFFDC',
    borderRadius: 20,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 4,
  },
  illustrationImage: {
    width: '85%',
    height: '85%',
    resizeMode: 'contain',
  },
     welcomeCard: {
     backgroundColor: '#ffffff',
     padding: 20,
     borderRadius: 12,
     marginTop: 25,
     marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  welcomeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  upcomingCard: {
    backgroundColor: '#ECFFDC',
    padding: 20,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  upcomingTitle: {
    fontSize: 14,
    color: '#333',
  },
  upcomingTime: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff4444',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end', // 오른쪽 정렬
    gap: 0, // 완전히 붙임
    marginBottom: 20,
  },
  actionButton: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 18,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minWidth: 0,
    alignItems: 'center',
    marginHorizontal: 0,
    marginLeft: 8, // 두 번째 버튼부터 살짝 띄움
  },
  actionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  studyCard: {
    backgroundColor: '#ECFFDC',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  studyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  studyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  studyProgress: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222',
    // backgroundColor, padding, borderRadius 제거
  },
  studyInfo: {
    gap: 8,
  },
  participantsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participant: {
    fontSize: 20,
    marginRight: 8,
  },
  addParticipantButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addParticipant: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  nextMeeting: {
    fontSize: 13,
    color: '#666',
  },
  createForm: {
    backgroundColor: '#ECFFDC',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  dropdown: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  dropdownText: {
    fontSize: 14,
    color: '#999',
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#666',
  },
     tabBar: {
     flexDirection: 'row',
     backgroundColor: '#ffffff',
     borderTopWidth: 1,
     borderTopColor: '#eee',
     paddingBottom: 10,
     paddingTop: 5,
   },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  activeTabButton: {
    // 활성 탭 스타일은 텍스트 색상으로 처리
  },
  tabButtonText: {
    fontSize: 12,
    color: '#666',
  },
  activeTabButtonText: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  dashboardContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
     bottomContent: {
     paddingHorizontal: 20,
     marginBottom: 20,
     position: 'absolute',
     bottom: 5,
     left: 0,
     right: 0,
   },
  divider: {
    height: 1,
    backgroundColor: '#ddd',
    width: '100%',
    marginVertical: 10,
  },
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  scheduleText: {
    fontSize: 14,
    color: '#333',
    marginTop: 5,
    marginRight: 10,
  },
  scheduleText1: {
    fontSize: 14,
    color: 'red',
    marginTop: 5,
    marginRight: 10,
  },
  scheduleTime: {
    fontSize: 14,
    color: '#ff4444',
    fontWeight: 'bold',
    marginTop: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  centerModalContent: {
    backgroundColor: '#ffffff',
    width: '100%',
    maxWidth: 500,
    borderRadius: 24,
    paddingTop: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    letterSpacing: -0.5,
  },
  closeButtonContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f8f8f8',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  closeButton: {
    fontSize: 18,
    color: '#666',
    fontWeight: '500',
  },
  searchModalContent: {
    maxWidth: 440,
  },
  searchContainer: {
    padding: 24,
  },
  searchLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  searchTypeContainer: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  searchTypeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  searchTypeActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  searchTypeText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  searchTypeTextActive: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  searchInputContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  searchInput: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    backgroundColor: '#fff',
    color: '#333',
  },
  searchButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
    height: 50,
    shadowColor: '#4CAF50',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  studyListSection: {
    marginTop: -10,
    marginHorizontal: 0,
    flex: 1, // 스크롤 영역이 화면을 꽉 채우도록 추가
  },
  studyListContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginHorizontal: -12,
    flex: 1, // 스크롤뷰가 남은 공간을 모두 차지하도록 추가
  },
  studyListItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#ffffff',
    marginBottom: 8,
    marginHorizontal: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  studyItemContent: {
    gap: 12,
  },
  studyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  studyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  studyProgress: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222',
    // backgroundColor, padding, borderRadius 제거
  },
  studyInfo: {
    gap: 8,
  },
  participantsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participant: {
    fontSize: 20,
    marginRight: 8,
  },
  addParticipantButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addParticipant: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  nextMeeting: {
    fontSize: 13,
    color: '#666',
  },
  moreSection: {
    marginTop: 20,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    marginHorizontal: -8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  moreItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  moreItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  moreIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ECFFDC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  moreIcon: {
    fontSize: 20,
  },
  moreTextContainer: {
    flex: 1,
  },
  moreItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  moreItemSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  moreArrow: {
    fontSize: 24,
    color: '#ccc',
    marginLeft: 8,
  },
  noResultContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noResultText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  createModalContent: {
    width: '90%',
    maxWidth: 440,
    maxHeight: '85%',
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
  },
  createModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginTop: -15,
    borderBottomWidth: 1,
    borderBottomColor: 'lightgrey',
  },
  createModalTitle: {
    marginLeft: 5,
    fontSize: 18,
    fontWeight: '700',
    color: 'black',
  },
  createCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    color: 'black',
  },
  createCloseButtonText: {
    fontSize: 18,
    color: 'black',
    fontWeight: '300',
    marginTop: -2,
  },
  createFormContainer: {
    padding: 20,
  },
  createFormRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  formGroupHalf: {
    flex: 1,
    marginBottom: 0,
  },
  createFormLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  createFormInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#fff',
    color: '#333',
    marginBottom: 15,
  },
  createTextArea: {
    height: 70,
    textAlignVertical: 'top',
    paddingTop: 12,
    lineHeight: 20,
  },
  createPeopleCountWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
  },
  createPeopleCountInput: {
    flex: 1,
    height: 44,
    fontSize: 14,
    color: '#333',
    padding: 0,
  },
  createPeopleCountLabel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  createModalFooter: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  createSubmitButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    marginTop: -30
  },
  createSubmitButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  scheduleModalContent: {
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingTop: 20,
  },
  scheduleList: {
    paddingHorizontal: 20,
    paddingTop: 15,
  },
  scheduleItem: {
    marginBottom: 25,
  },
  scheduleItemHeader: {
    marginBottom: 10,
  },
  dateBadge: {
    backgroundColor: '#ECFFDC',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  scheduleDate: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  scheduleItemContent: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    padding: 2,
  },
  scheduleTimeContainer: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    alignItems: 'center',
    width: 75,
  },
  scheduleTime: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  scheduleTimeLine: {
    width: 2,
    height: '70%',
    backgroundColor: '#ECFFDC',
    position: 'absolute',
    right: 0,
    top: '15%',
  },
  scheduleMainContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 15,
  },
  scheduleInfo: {
    flex: 1,
    marginRight: 10,
  },
  scheduleItemTitle: {
    fontSize: 13,
    color: '#333',
    fontWeight: '600',
    marginBottom: 8,
  },
  scheduleMetaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scheduleStatusBadge: {
    backgroundColor: '#FFF5E6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  scheduleStatusText: {
    fontSize: 12,
    color: '#FF9800',
    fontWeight: '500',
  },
  scheduleDuration: {
    fontSize: 13,
    color: '#666',
  },
  scheduleActionButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    shadowColor: '#4CAF50',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  scheduleActionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  pickerModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  pickerContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  pickerDoneButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  picker: {
    width: '100%',
    height: 215,
  },
  placeholderText: {
    color: '#999',
  },
  categorySelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 12,
    height: 44,
    marginTop: 5
  },
  categoryText: {
    fontSize: 13,
    color: '#333',
    flex: 1,
  },
  categoryArrow: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  categoryModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  categoryModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  categoryModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  categoryModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  categoryCloseButton: {
    padding: 8,
  },
  categoryCloseButtonText: {
    fontSize: 20,
    color: '#666',
  },
  categoryList: {
    padding: 12,
  },
  categoryItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginVertical: 4,
  },
  categoryItemSelected: {
    backgroundColor: '#ECFFDC',
  },
  categoryItemText: {
    fontSize: 15,
    color: '#333',
  },
  categoryItemTextSelected: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  input: {
    flex: 1,
    fontSize: 17,
    height: 48,
    padding: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    marginRight: 10,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F5F5F5',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 2,
    marginTop: 1,
  },
  categoryBadgeText: {
    fontSize: 10,
    color: '#666',
    fontWeight: 'bold',
  },
  actionIconContainer: {
    marginRight: 8,
  },
  categoryButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 18,
    marginRight: 8,
    // borderWidth, borderColor 제거
  },
  categoryButtonSelected: {
    backgroundColor: '#4CAF50',
    borderColor: '#388E3C',
  },
  categoryButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  categoryButtonTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 100,
  },
  hostNameText: {
    fontSize: 11,
    color: '#999',
    marginTop: 6,
    textAlign: 'right',
  },
  studyDescription: {
    fontSize: 13,
    color: '#666',
    marginTop: 6,
    marginBottom: 4,
  },
});

export default StudyApp;


