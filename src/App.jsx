import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import Hero from './sections/Hero.jsx';
import About from './sections/About.jsx';
import Footer from './sections/Footer.jsx';
import Navbar from './sections/Navbar.jsx';
import Contact from './sections/Contact.jsx';
import Projects from './sections/Projects.jsx';
import WorkExperience from './sections/Experience.jsx';
import catImage from './cat.png';
import StartLoading from './StartLoading';
import RockPaperGame from './3DRockPaper.jsx'; 
import { db } from './firebase';
import { collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';

const App = () => {
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const starsRef = useRef([]);
  const spacecraftRef = useRef(null);
  const [hideAndSeekActive, setHideAndSeekActive] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [catPosition, setCatPosition] = useState(null);
  const [showFindMeDialog, setShowFindMeDialog] = useState(false);
  const [showFoundDialog, setShowFoundDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Add dropdown state
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [showRPSGame, setShowRPSGame] = useState(false);

  const [visitorLogs, setVisitorLogs] = useState([]);
  const [showVisitorLog, setShowVisitorLog] = useState(false);
  const [visitorName, setVisitorName] = useState('');
  const [visitorCompany, setVisitorCompany] = useState('');
  const [showVisitorForm, setShowVisitorForm] = useState(false);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000); 

    return () => clearTimeout(timer);
  }, []);

  // Fetch visitor logs from Firestore
  useEffect(() => {
    const fetchVisitorLogs = async () => {
      try {
        setIsLoadingLogs(true);
        const visitorLogsRef = collection(db, "visitorLogs");
        const q = query(visitorLogsRef, orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);
        
        const logs = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          logs.push({
            name: data.name,
            company: data.company,
            date: new Date(data.timestamp.toDate()).toLocaleString(),
            outcome: data.outcome
          });
        });
        
        setVisitorLogs(logs);
      } catch (error) {
        console.error("Error fetching visitor logs:", error);
      } finally {
        setIsLoadingLogs(false);
      }
    };

    fetchVisitorLogs();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleHideAndSeek = () => {
    if (showRPSGame) return;

    if (hideAndSeekActive) {
      setHideAndSeekActive(false);
      setCatPosition(null);
      return;
    }

    setHideAndSeekActive(true);
    setShowFindMeDialog(true);
    setTimeout(() => {
      setShowFindMeDialog(false);
      const randomX = Math.random() * window.innerWidth * 0.8;
      const randomY = Math.random() * window.innerHeight * 0.8;
      setCatPosition({ x: randomX, y: randomY });
    }, 2500);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  useEffect(() => {
    if (catPosition && Math.abs(mousePosition.x - catPosition.x) < 50 && Math.abs(mousePosition.y - catPosition.y) < 50) {
      setShowFoundDialog(true);
      setTimeout(() => {
        setShowFoundDialog(false);
        setHideAndSeekActive(false);
        setCatPosition(null);
        setShowRPSGame(true);
      }, 2000);
    }
  }, [mousePosition, catPosition]);

  const toggleVisitorLog = () => {
    setShowVisitorLog(!showVisitorLog);
    setDropdownOpen(false);
  };

  const handleVisitorSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const newVisitor = {
        name: visitorName,
        company: visitorCompany,
        timestamp: new Date(),
        outcome: 'Winner'
      };

      // Add to Firestore
      await addDoc(collection(db, "visitorLogs"), newVisitor);
      
      // Update local state with formatted date for display
      const visitorWithFormattedDate = {
        ...newVisitor,
        date: newVisitor.timestamp.toLocaleString()
      };
      
      setVisitorLogs([visitorWithFormattedDate, ...visitorLogs]);
      setVisitorName('');
      setVisitorCompany('');
      setShowVisitorForm(false);
    } catch (error) {
      console.error("Error adding visitor:", error);
      alert("Failed to save your information. Please try again.");
    }
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };
  
  const returnToWebsite = () => {
    setShowVisitorForm(true);
    setShowRPSGame(false);
  };

  const handleGameWin = () => {
    setShowVisitorForm(true);
  };

  return (
    <>
      {isLoading ? (
        <StartLoading />
      ) : (
        <>
          <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full -z-10" />

          {!showRPSGame && (
            <div className="fixed top-6 right-1 z-50" ref={dropdownRef}>
              {/* Show dropdown button for smaller screens (change from md to lg breakpoint) */}
              <div className="lg:hidden">
                <button
                  onClick={toggleDropdown}
                >
                  <span className="relative z-10 text-white font-bold text-lg"  style={{
                        background: 'linear-gradient(90deg, red, orange, yellow, green)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        color: 'transparent',
                      }}>↓</span>
                </button>
                
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-1">
                    <a
                      onClick={() => {
                        toggleHideAndSeek();
                        setDropdownOpen(false);
                      }}
                      className="block px-4 py-2 text-sm hover:bg-gray-100 cursor-pointer"
                      style={{
                        background: 'linear-gradient(90deg, red, orange, yellow, green)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        color: 'transparent',
                      }}
                    >
                      {hideAndSeekActive ? "End Hide & Seek" : "Hide & Seek"}
                    </a>
                    
                    <button
                      onClick={toggleVisitorLog}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Visitor Log
                    </button>
                  </div>
                )}
              </div>
              
              {/* Show original buttons only on laptop/desktop (change from md to lg) */}
              <div className="hidden lg:flex flex-row items-end gap-2">
                <a
                  onClick={toggleHideAndSeek}
                  className="cursor-pointer py-1 px-2 rounded-lg transition-colors duration-300 text-sm"
                  style={{
                    background: 'linear-gradient(90deg, red, orange, yellow, green)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    color: 'transparent',
                  }}
                >
                  {hideAndSeekActive ? "End Hide & Seek" : "Hide & Seek"}
                </a>
              
                <button
                  onClick={toggleVisitorLog}
                  className="bg-[#949291]/10 hover:bg-[#949291]/20 text-[#949291] font-normal py-1 px-2 rounded-lg transition-colors duration-300 text-sm"
                >
                  Visitor Log
                </button>
              </div>
            </div>
          )}

          {hideAndSeekActive && (
            <div className="fixed inset-0 bg-black z-30" style={{
              maskImage: `radial-gradient(circle 600px at ${mousePosition.x}px ${mousePosition.y}px, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 1) 70%)`,
              WebkitMaskImage: `radial-gradient(circle 600px at ${mousePosition.x}px ${mousePosition.y}px, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 1) 70%)`
            }} />
          )}

          {showFindMeDialog && (
            <div className="fixed top-1/3 left-1/2 transform -translate-x-1/2 bg-white p-4 rounded shadow-lg z-50">
              <img src={catImage} alt="Cat" className="w-20 h-20 mx-auto" />
              <p className="text-center mt-2">Find me, I am hiding!</p>
            </div>
          )}

          {catPosition && (
            <img
              src={catImage}
              alt="Hidden Cat"
              className="absolute"
              style={{ left: catPosition.x, top: catPosition.y, width: 50, height: 50 }}
            />
          )}

          {showFoundDialog && (
            <div className="fixed top-1/3 left-1/2 transform -translate-x-1/2 bg-white p-4 rounded shadow-lg z-50">
              <p className="text-center mt-2">Well Done!! Let's play a quick game for a <b style={{
                color: 'Black',
              }}>referral</b></p>
            </div>
          )}

          {showVisitorLog && (
            <div className="fixed inset-0 bg-gray-800 bg-opacity-80 z-50 flex items-center justify-center">
              <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold">Visitor Log</h2>
                  <button
                    onClick={toggleVisitorLog}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    ✕
                  </button>
                </div>

                {isLoadingLogs ? (
                  <p className="text-center py-8">Loading visitor logs...</p>
                ) : visitorLogs.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No visitors recorded yet.</p>
                ) : (
                  <table className="w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="py-2 px-4 text-left">Name</th>
                        <th className="py-2 px-4 text-left">Company</th>
                        <th className="py-2 px-4 text-left">Date</th>
                        <th className="py-2 px-4 text-left">Result</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visitorLogs.map((visitor, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                          <td className="py-2 px-4">{visitor.name}</td>
                          <td className="py-2 px-4">{visitor.company}</td>
                          <td className="py-2 px-4">{visitor.date}</td>
                          <td className="py-2 px-4 text-green-600 font-medium">{visitor.outcome}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {showVisitorForm && (
            <div className="fixed inset-0 bg-gray-800 bg-opacity-80 z-50 flex items-center justify-center">
              <div className="bg-white rounded-lg p-6 max-w-md">
                <h3 className="text-xl font-bold mb-4">Record Your Entry Please!</h3>
                <form onSubmit={handleVisitorSubmit}>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                      Your Name:
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={visitorName}
                      onChange={(e) => setVisitorName(e.target.value)}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      required
                    />
                  </div>
                  <div className="mb-6">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="company">
                      Company:
                    </label>
                    <input
                      id="company"
                      type="text"
                      value={visitorCompany}
                      onChange={(e) => setVisitorCompany(e.target.value)}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      required
                    />
                  </div>
                  <div className="flex justify-between">
                    <button
                      type="submit"
                      className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    >
                      Submit
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowVisitorForm(false)}
                      className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    >
                      Skip
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {showRPSGame ? (
            <div className="fixed inset-0 z-40">
              <RockPaperGame
                onGameWin={handleGameWin}
                onReturnToWebsite={returnToWebsite}
                onGameLose={handleGameWin}
              />
            </div>
          ) : (
            <main className="max-w-7xl mx-auto relative z-20">
              <Navbar />
              <Hero />
              <About />
              <Projects />
              <WorkExperience />
              <Contact />
              <Footer />
            </main>
          )}
        </>
      )}

      <style jsx>{`
        @keyframes dissolve {
          0% { opacity: 1; transform: translateY(0); filter: blur(0); }
          100% { opacity: 0; transform: translateY(20px); filter: blur(10px); }
        }
        
        @keyframes rainbow {
          0% { background-position: 0% 50% }
          50% { background-position: 100% 50% }
          100% { background-position: 0% 50% }
        }
      `}</style>
    </>
  );
};

export default App;