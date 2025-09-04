const DefaultChatContent = () => {
  return (
    <div className="flex-1 flex items-center  justify-center text-center">
      <div className="max-w-md">
        <div className="text-4xl mb-4">👋</div>
        <h3 className="text-lg font-semibold mb-2">
          Welcome to Career Counseling
        </h3>
        <p className="text-muted-foreground mb-6">
          I&apos;m here to help you navigate your career journey. You can ask me
          about:
        </p>
        <div className="grid grid-cols-1 gap-2 text-sm text-left">
          <div className="p-3 bg-muted rounded-lg">
            <strong>Career Planning:</strong> Goal setting, career paths,
            industry insights
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <strong>Job Search:</strong> Resume tips, interview prep, networking
            strategies
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <strong>Skill Development:</strong> Learning recommendations,
            certifications
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <strong>Career Transitions:</strong> Changing fields, career pivots,
            next steps
          </div>
        </div>
        <p className="text-muted-foreground mt-4">
          Start by telling me about your career goals or any challenges
          you&apos;re facing!
        </p>
      </div>
    </div>
  );
};

export default DefaultChatContent;
