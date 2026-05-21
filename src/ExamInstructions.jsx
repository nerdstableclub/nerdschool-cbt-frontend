import React, { useState } from 'react';

export default function ExamInstructions({ onProceed }) {
  const [isChecked, setIsChecked] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans select-none">
      
      {/* HEADER */}
      <div className="bg-[#1e448b] text-white p-4 shadow-md flex justify-between items-center">
        <h1 className="text-xl font-bold">UGC-NET June 2026</h1>
        <div className="text-sm">English - Paper 1 & 2</div>
      </div>

      <div className="flex-1 flex justify-center p-4">
        <div className="bg-white max-w-5xl w-full shadow-lg border border-gray-300 flex flex-col h-[calc(100vh-80px)]">
          
          {/* TITLE */}
          <div className="p-4 border-b border-gray-300">
            <h2 className="text-xl font-bold text-center text-[#1e448b]">Please read the instructions carefully</h2>
          </div>

          {/* SCROLLABLE INSTRUCTIONS AREA */}
          <div className="flex-1 overflow-y-auto p-8 text-[15px] text-gray-800 leading-relaxed">
            <h3 className="font-bold underline mb-4 text-lg">General Instructions:</h3>
            
            <ol className="list-decimal pl-6 space-y-3 mb-6">
              <li>Total duration of UGC-NET - English-Paper 2-Jul-2026 is 180 min.</li>
              <li>The clock will be set at the server. The countdown timer in the top right corner of screen will display the remaining time available for you to complete the examination. When the timer reaches zero, the examination will end by itself. You will not be required to end or submit your examination.</li>
              <li>The Questions Palette displayed on the right side of screen will show the status of each question using one of the following symbols:
                <ul className="mt-4 space-y-4 list-none pl-2">
                  <li className="flex items-center gap-3">
                    <div className="w-8 h-8 flex items-center justify-center bg-white border border-gray-400 text-gray-700 rounded text-sm">1</div>
                    <span>You have not visited the question yet.</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-8 h-8 flex items-center justify-center bg-[#e74c3c] text-white rounded-t-lg rounded-b-sm text-sm">2</div>
                    <span>You have not answered the question.</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-8 h-8 flex items-center justify-center bg-[#27ae60] text-white rounded-t-lg rounded-b-sm text-sm">3</div>
                    <span>You have answered the question.</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-8 h-8 flex items-center justify-center bg-[#8e44ad] text-white rounded-full text-sm">4</div>
                    <span>You have NOT answered the question, but have marked the question for review.</span>
                  </li>
                  <li className="flex items-center gap-3 relative">
                    <div className="w-8 h-8 flex items-center justify-center bg-[#8e44ad] text-white rounded-full text-sm relative">
                      5 <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#27ae60] border border-white rounded-full"></span>
                    </div>
                    <span>The question(s) "Answered and Marked for Review" will be considered for evalution.</span>
                  </li>
                </ul>
              </li>
              <li className="mt-4">You can click on the "&gt;" arrow which apperes to the left of question palette to collapse the question palette thereby maximizing the question window. To view the question palette again, you can click on "&lt;" which appears on the right side of question window.</li>
              <li>You can click on your "Profile" image on top right corner of your screen to change the language during the exam for entire question paper. On clicking of Profile image you will get a drop-down to change the question content to the desired language.</li>
              <li>You can click on ⬇ to navigate to the bottom and ⬆ to navigate to top of the question are, without scrolling.</li>
            </ol>

            <h3 className="font-bold underline mb-4 text-lg">Navigating to a Question:</h3>
            <p className="mb-2 font-semibold">To answer a question, do the following:</p>
            <ol className="list-decimal pl-6 space-y-2 mb-6">
              <li>Click on the question number in the Question Palette at the right of your screen to go to that numbered question directly. Note that using this option does NOT save your answer to the current question.</li>
              <li>Click on <strong>Save & Next</strong> to save your answer for the current question and then go to the next question.</li>
              <li>Click on <strong>Mark for Review & Next</strong> to save your answer for the current question, mark it for review, and then go to the next question.</li>
            </ol>

            <h3 className="font-bold underline mb-4 text-lg">Answering a Question:</h3>
            <p className="mb-2 font-semibold">Procedure for answering a multiple choice type question:</p>
            <ol className="list-decimal pl-6 space-y-2 mb-6">
              <li>To select you answer, click on the button of one of the options.</li>
              <li>To deselect your chosen answer, click on the button of the chosen option again or click on the <strong>Clear Response</strong> button.</li>
              <li>To change your chosen answer, click on the button of another option.</li>
              <li>To save your answer, you MUST click on the <strong>Save & Next</strong> button.</li>
              <li>To mark the question for review, click on the <strong>Mark for Review & Next</strong> button.</li>
              <li>To change your answer to a question that has already been answered, first select that question for answering and then follow the procedure for answering that type of question.</li>
            </ol>

            <h3 className="font-bold underline mb-4 text-lg">Navigating through sections:</h3>
            <ol className="list-decimal pl-6 space-y-2 mb-8">
              <li>Sections in this question paper are displayed on the top bar of the screen. Questions in a section can be viewed by click on the section name. The section you are currently viewing is highlighted.</li>
              <li>After click the <strong>Save & Next</strong> button on the last question for a section, you will automatically be taken to the first question of the next section.</li>
              <li>You can shuffle between sections and questions anything during the examination as per your convenience only during the time stipulated.</li>
              <li>Candidate can view the corresponding section summery as part of the legend that appears in every section above the question palette.</li>
              <li>Please note all questions will appear in your default language. This language can be changed for a particular question later on.</li>
            </ol>
            
            <hr className="my-6 border-gray-300" />

            {/* CHECKBOX AREA */}
            <div className="flex items-start gap-4 mb-4">
              <input 
                type="checkbox" 
                id="declaration" 
                className="w-5 h-5 mt-1 cursor-pointer"
                checked={isChecked}
                onChange={(e) => setIsChecked(e.target.checked)}
              />
              <label htmlFor="declaration" className="text-sm font-semibold text-gray-700 leading-relaxed cursor-pointer">
                I have read and understood the instructions. All computer hardware allotted to me are in proper working condition. I declare that I am not in possession of / not wearing / not carrying any prohibited gadget like mobile phone, bluetooth devices etc. /any prohibited material with me into the Examination Hall. I agree that in case of not adhering to the instructions, I shall be liable to be debarred from this Test and/or to disciplinary action, which may include ban from future Tests / Examinations.
              </label>
            </div>

          </div>

          {/* FOOTER BUTTON */}
          <div className="p-4 bg-gray-100 border-t border-gray-300 flex justify-center">
            <button 
              disabled={!isChecked}
              onClick={onProceed}
              className={`px-12 py-2.5 font-bold text-lg rounded shadow transition-all ${isChecked ? 'bg-[#27ae60] text-white hover:bg-[#219653]' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
            >
              PROCEED
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}