'use client'

import { useState, useEffect } from 'react'
import { MainLayout } from '@/frontend/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/frontend/components/ui/card'
import { Button } from '@/frontend/components/ui/button'
import { Badge } from '@/frontend/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/frontend/components/ui/dialog'
import { Input } from '@/frontend/components/ui/input'
import { Label } from '@/frontend/components/ui/label'
import { 
  Plus, 
  Link as LinkIcon, 
  Unlink, 
  Settings, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  Refresh,
  ExternalLink,
  Users,
  TrendingUp
} from 'lucide-react'
import { formatDateTime } from '@/frontend/lib/utils'

interface SocialAccount {
  id: string
  platform: 'facebook' | 'instagram' | 'tiktok' | 'threads' | 'youtube'
  accountName: string
  accountId: string
  isActive: boolean
  connectedAt: string
  lastSync: string
  tokenExpiry?: string
  followers?: number
  status: 'connected' | 'expired' | 'error' | 'disconnected'
  errorMessage?: string
}

interface PlatformInfo {
  id: string
  name: string
  icon: string
  color: string
  description: string
  features: string[]
  authUrl?: string
}

const platforms: PlatformInfo[] = [
  {
    id: 'facebook',
    name: 'Facebook',
    icon: '📘',
    color: 'from-blue-500 to-blue-600',
    description: 'Share posts, images, and videos to your Facebook page',
    features: ['Pages & Groups', 'Scheduled Posts', 'Analytics', 'Auto-posting']
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: '📸',
    color: 'from-pink-500 to-purple-600',
    description: 'Share photos, videos, and stories to Instagram',
    features: ['Feed Posts', 'Stories', 'Reels', 'Analytics', 'Hashtag suggestions']
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: '🎵',
    color: 'from-black to-gray-800',
    description: 'Upload videos to TikTok with trending hashtags',
    features: ['Video Upload', 'Trending Analysis', 'Hashtag optimization', 'Analytics']
  },
  {
    id: 'youtube',
    name: 'YouTube',
    icon: '📺',
    color: 'from-red-500 to-red-600',
    description: 'Upload videos and manage your YouTube channel',
    features: ['Video Upload', 'Thumbnails', 'Descriptions', 'Analytics', 'Playlists']
  },
  {
    id: 'threads',
    name: 'Threads',
    icon: '🧵',
    color: 'from-gray-700 to-gray-900',
    description: 'Share text posts and engage in conversations',
    features: ['Text Posts', 'Thread Creation', 'Replies', 'Analytics']
  }
]

export default function SocialPage() {
  const [accounts, setAccounts] = useState<SocialAccount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showConnectDialog, setShowConnectDialog] = useState(false)
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformInfo | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)

  useEffect(() => {
    fetchSocialAccounts()
  }, [])

  const fetchSocialAccounts = async () => {
    try {
      // TODO: Replace with actual API call
      // Simulated data for now
      const mockData: SocialAccount[] = [
        {
          id: '1',
          platform: 'facebook',
          accountName: 'My Business Page',
          accountId: 'fb_123456789',
          isActive: true,
          connectedAt: '2024-01-10T10:00:00Z',
          lastSync: '2024-01-18T08:30:00Z',
          tokenExpiry: '2024-03-10T10:00:00Z',
          followers: 2500,
          status: 'connected'
        },
        {
          id: '2',
          platform: 'instagram',
          accountName: '@mybusiness',
          accountId: 'ig_987654321',
          isActive: true,
          connectedAt: '2024-01-12T14:00:00Z',
          lastSync: '2024-01-18T09:00:00Z',
          tokenExpiry: '2024-02-12T14:00:00Z',
          followers: 5200,
          status: 'connected'
        },
        {
          id: '3',
          platform: 'youtube',
          accountName: 'My YouTube Channel',
          accountId: 'yt_111222333',
          isActive: false,
          connectedAt: '2024-01-05T12:00:00Z',
          lastSync: '2024-01-15T10:00:00Z',
          tokenExpiry: '2024-01-18T12:00:00Z',
          followers: 1200,
          status: 'expired',
          errorMessage: 'Access token has expired. Please reconnect your account.'
        }
      ]

      setAccounts(mockData)
    } catch (error) {
      console.error('Failed to fetch social accounts:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'expired':
        return <Clock className="h-4 w-4 text-yellow-600" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      case 'disconnected':
        return <Unlink className="h-4 w-4 text-gray-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-800'
      case 'expired':
        return 'bg-yellow-100 text-yellow-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      case 'disconnected':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleConnectPlatform = async (platform: PlatformInfo) => {
    setSelectedPlatform(platform)
    setShowConnectDialog(true)
  }

  const handleConnect = async () => {
    if (!selectedPlatform) return
    
    setIsConnecting(true)
    try {
      // TODO: Implement OAuth flow for each platform
      console.log('Connecting to', selectedPlatform.name)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Add new account to list
      const newAccount: SocialAccount = {
        id: Date.now().toString(),
        platform: selectedPlatform.id as any,
        accountName: `New ${selectedPlatform.name} Account`,
        accountId: `${selectedPlatform.id}_${Date.now()}`,
        isActive: true,
        connectedAt: new Date().toISOString(),
        lastSync: new Date().toISOString(),
        followers: Math.floor(Math.random() * 10000),
        status: 'connected'
      }
      
      setAccounts(prev => [...prev, newAccount])
      setShowConnectDialog(false)
      setSelectedPlatform(null)
    } catch (error) {
      console.error('Failed to connect platform:', error)
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnect = async (accountId: string) => {
    try {
      // TODO: Implement disconnect API call
      console.log('Disconnecting account:', accountId)
      
      setAccounts(prev => prev.filter(acc => acc.id !== accountId))
    } catch (error) {
      console.error('Failed to disconnect account:', error)
    }
  }

  const handleRefreshToken = async (accountId: string) => {
    try {
      // TODO: Implement token refresh
      console.log('Refreshing token for account:', accountId)
      
      setAccounts(prev => prev.map(acc => 
        acc.id === accountId 
          ? { ...acc, status: 'connected', lastSync: new Date().toISOString() }
          : acc
      ))
    } catch (error) {
      console.error('Failed to refresh token:', error)
    }
  }

  const connectedPlatforms = accounts.filter(acc => acc.status === 'connected')
  const totalFollowers = accounts.reduce((sum, acc) => sum + (acc.followers || 0), 0)

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Social Accounts</h1>
          <p className="text-muted-foreground mt-2">
            Connect and manage your social media accounts for publishing content
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Connected Accounts</CardTitle>
              <LinkIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{connectedPlatforms.length}</div>
              <p className="text-xs text-muted-foreground">
                {platforms.length - connectedPlatforms.length} more available
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Reach</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalFollowers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Combined followers across platforms
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Account Health</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {Math.round((connectedPlatforms.length / accounts.length) * 100) || 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                Accounts active and ready
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Connected Accounts */}
        {accounts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Connected Accounts</CardTitle>
              <CardDescription>
                Manage your connected social media accounts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {accounts.map((account) => {
                  const platform = platforms.find(p => p.id === account.platform)!
                  
                  return (
                    <div key={account.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${platform.color} flex items-center justify-center text-white text-xl`}>
                          {platform.icon}
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium">{account.accountName}</h3>
                            <Badge variant="secondary" className={getStatusColor(account.status)}>
                              {getStatusIcon(account.status)}
                              {account.status}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {platform.name} • Connected {formatDateTime(account.connectedAt)}
                            {account.followers && (
                              <> • {account.followers.toLocaleString()} followers</>
                            )}
                          </div>
                          {account.errorMessage && (
                            <div className="text-sm text-red-600">
                              {account.errorMessage}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {account.status === 'expired' && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleRefreshToken(account.id)}
                          >
                            <Refresh className="h-4 w-4 mr-2" />
                            Refresh
                          </Button>
                        )}
                        
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDisconnect(account.id)}
                        >
                          <Unlink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Available Platforms */}
        <Card>
          <CardHeader>
            <CardTitle>Available Platforms</CardTitle>
            <CardDescription>
              Connect additional social media platforms to expand your reach
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {platforms
                .filter(platform => !accounts.some(acc => acc.platform === platform.id))
                .map((platform) => (
                  <Card key={platform.id} className="relative">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${platform.color} flex items-center justify-center text-white text-lg`}>
                            {platform.icon}
                          </div>
                          <h3 className="font-semibold">{platform.name}</h3>
                        </div>
                        
                        <p className="text-sm text-muted-foreground">
                          {platform.description}
                        </p>
                        
                        <div className="space-y-2">
                          <div className="text-sm font-medium">Features:</div>
                          <div className="flex flex-wrap gap-1">
                            {platform.features.map((feature, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {feature}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        <Button 
                          onClick={() => handleConnectPlatform(platform)}
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Connect {platform.name}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Connect Dialog */}
        <Dialog open={showConnectDialog} onOpenChange={setShowConnectDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Connect to {selectedPlatform?.name}
              </DialogTitle>
              <DialogDescription>
                You'll be redirected to {selectedPlatform?.name} to authorize access to your account
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {selectedPlatform && (
                <div className="flex items-center space-x-3 p-4 border rounded-lg">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${selectedPlatform.color} flex items-center justify-center text-white text-xl`}>
                    {selectedPlatform.icon}
                  </div>
                  <div>
                    <h4 className="font-medium">{selectedPlatform.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedPlatform.description}
                    </p>
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <div className="text-sm font-medium">What we'll access:</div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Read basic profile information</li>
                  <li>• Publish posts on your behalf</li>
                  <li>• Access analytics and insights</li>
                  <li>• Manage scheduled content</li>
                </ul>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowConnectDialog(false)}
                  disabled={isConnecting}
                >
                  Cancel
                </Button>
                <Button onClick={handleConnect} disabled={isConnecting}>
                  {isConnecting ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                      <span>Connecting...</span>
                    </div>
                  ) : (
                    <>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Connect Account
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  )
}