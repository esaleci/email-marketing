import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function RecentEmails() {
  // Mock recent emails data
  const recentEmails = [
    {
      id: 1,
      recipient: "john.doe@example.com",
      name: "John Doe",
      subject: "Welcome to Our Service",
      sentAt: "2023-05-10T09:15:00",
      status: "Delivered",
    },
    {
      id: 2,
      recipient: "jane.smith@example.com",
      name: "Jane Smith",
      subject: "Your Monthly Update - May 2023",
      sentAt: "2023-05-10T08:30:00",
      status: "Opened",
    },
    {
      id: 3,
      recipient: "bob.johnson@example.com",
      name: "Bob Johnson",
      subject: "Introducing Our New Feature",
      sentAt: "2023-05-09T16:45:00",
      status: "Clicked",
    },
    {
      id: 4,
      recipient: "alice.williams@example.com",
      name: "Alice Williams",
      subject: "Following Up on Our Conversation",
      sentAt: "2023-05-09T14:20:00",
      status: "Delivered",
    },
    {
      id: 5,
      recipient: "charlie.brown@example.com",
      name: "Charlie Brown",
      subject: "Special Offer Just for You",
      sentAt: "2023-05-09T11:10:00",
      status: "Bounced",
    },
    {
      id: 6,
      recipient: "diana.miller@example.com",
      name: "Diana Miller",
      subject: "Join Our Upcoming Webinar",
      sentAt: "2023-05-08T15:30:00",
      status: "Opened",
    },
    {
      id: 7,
      recipient: "edward.davis@example.com",
      name: "Edward Davis",
      subject: "Your Account Summary",
      sentAt: "2023-05-08T13:45:00",
      status: "Clicked",
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Delivered":
        return "text-blue-500"
      case "Opened":
        return "text-green-500"
      case "Clicked":
        return "text-purple-500"
      case "Bounced":
        return "text-red-500"
      default:
        return "text-gray-500"
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    }).format(date)
  }

  return (
    <div className="space-y-8">
      {recentEmails.map((email) => (
        <div key={email.id} className="flex items-start">
          <Avatar className="h-9 w-9">
            <AvatarImage src={`/abstract-geometric-shapes.png?height=36&width=36&query=${email.name}`} alt={email.name} />
            <AvatarFallback>
              {email.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">{email.name}</p>
            <p className="text-sm text-muted-foreground">{email.recipient}</p>
            <p className="text-sm">{email.subject}</p>
            <div className="flex items-center pt-2">
              <p className="text-xs text-muted-foreground">{formatDate(email.sentAt)}</p>
              <div className={`ml-2 text-xs font-medium ${getStatusColor(email.status)}`}>• {email.status}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
